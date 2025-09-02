'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Database } from '@/lib/supabase';
import { Upload, FileText, AlertCircle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

type ContactImportFormProps = {
  userId: string;
  remainingContacts: number;
  compact?: boolean;
};

type Contact = {
  name: string;
  phone: string;
  email?: string;
  group?: string;
  notes?: string;
};

export function ContactImportForm({ userId, remainingContacts, compact = false }: ContactImportFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileType, setFileType] = useState<'csv' | 'xlsx'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'importing' | 'success'>('idle');
  
  // Listas: permitir escolher lista alvo (ou nenhuma) e criar nova
  const [lists, setLists] = useState<{ id: string; name: string }[]>([]);
  const [targetListId, setTargetListId] = useState<string>('');
  const [newListName, setNewListName] = useState<string>('');
  
  // Garante que exista a organização do usuário e retorna seu id
  const ensureOrganization = async (): Promise<string> => {
    const { data: org, error: selErr } = await supabase
      .from('organizations' as any)
      .select('id')
      .eq('id', userId as any)
      .maybeSingle();
    if (!selErr && org?.id) return org.id as any;
    const { data: inserted, error: insErr } = await supabase
      .from('organizations' as any)
      .insert({ id: userId as any, owner_id: userId as any, name: 'Conta' })
      .select('id')
      .single();
    if (insErr) throw insErr;
    return inserted.id as any;
  };
  
  // Carregar listas do usuário
  useEffect(() => {
    const loadLists = async () => {
      try {
        const orgId = await ensureOrganization();
        const { data, error } = await supabase
          .from('contact_lists')
          .select('id, name')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setLists(data || []);
      } catch (err) {
        console.error('Erro ao carregar listas:', err);
      }
    };
    loadLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Função para lidar com a seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedFile(file);
    setIsUploading(true);
    
    // Determinar o tipo de arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension === 'csv') {
      setFileType('csv');
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      setFileType('xlsx');
      parseExcel(file);
    } else {
      toast.error('Formato de arquivo não suportado. Use CSV ou XLSX.');
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // Função para analisar arquivo CSV
  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processImportedData(results.data as any[]);
        setIsUploading(false);
      },
      error: (error) => {
        console.error('Erro ao processar CSV:', error);
        toast.error('Erro ao processar o arquivo CSV. Verifique o formato.');
        setIsUploading(false);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    });
  };
  
  // Função para analisar arquivo Excel
  const parseExcel = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      processImportedData(jsonData as any[]);
      setIsUploading(false);
    } catch (error) {
      console.error('Erro ao processar Excel:', error);
      toast.error('Erro ao processar o arquivo Excel. Verifique o formato.');
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // Função para processar os dados importados
  const processImportedData = (data: any[]) => {
    setIsProcessing(true);
    const errors: string[] = [];
    const processedContacts: Contact[] = [];
    
    // Mapear cabeçalhos comuns para os campos esperados
    const headerMappings: Record<string, string[]> = {
      name: ['name', 'nome', 'fullname', 'full name', 'nome completo'],
      phone: ['phone', 'telefone', 'celular', 'mobile', 'whatsapp', 'número', 'number'],
      email: ['email', 'e-mail', 'correio eletrônico'],
      group: ['group', 'grupo', 'categoria', 'category', 'tag'],
      notes: ['notes', 'observações', 'observacoes', 'obs', 'comentários', 'comentarios', 'comments']
    };
    
    // Função para encontrar a chave correspondente nos dados
    const findKey = (obj: any, fieldMappings: string[]): string | undefined => {
      const keys = Object.keys(obj).map(k => k.toLowerCase());
      for (const mapping of fieldMappings) {
        const matchedKey = keys.find(k => k === mapping.toLowerCase());
        if (matchedKey) {
          return Object.keys(obj).find(k => k.toLowerCase() === matchedKey);
        }
      }
      return undefined;
    };
    
    // Processar cada linha
    data.forEach((row, index) => {
      try {
        // Encontrar as chaves correspondentes
        const nameKey = findKey(row, headerMappings.name);
        const phoneKey = findKey(row, headerMappings.phone);
        const emailKey = findKey(row, headerMappings.email);
        const groupKey = findKey(row, headerMappings.group);
        const notesKey = findKey(row, headerMappings.notes);
        
        // Verificar campos obrigatórios
        if (!nameKey || !row[nameKey]) {
          errors.push(`Linha ${index + 1}: Nome não encontrado ou vazio`);
          return;
        }
        
        if (!phoneKey || !row[phoneKey]) {
          errors.push(`Linha ${index + 1}: Telefone não encontrado ou vazio`);
          return;
        }
        
        // Formatar o telefone
        let phone = String(row[phoneKey]).replace(/\s+/g, '').replace(/[()\-]/g, '');
        if (!phone.startsWith('+')) {
          phone = `+${phone}`;
        }
        
        // Validar formato do telefone
        if (!/^\+?[0-9]+$/.test(phone)) {
          errors.push(`Linha ${index + 1}: Formato de telefone inválido: ${phone}`);
          return;
        }
        
        // Criar objeto de contato
        const contact: Contact = {
          name: String(row[nameKey]),
          phone,
        };
        
        // Adicionar campos opcionais se existirem
        if (emailKey && row[emailKey]) {
          const email = String(row[emailKey]);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push(`Linha ${index + 1}: Formato de email inválido: ${email}`);
          } else {
            contact.email = email;
          }
        }
        
        if (groupKey && row[groupKey]) {
          contact.group = String(row[groupKey]);
        }
        
        if (notesKey && row[notesKey]) {
          contact.notes = String(row[notesKey]);
        }
        
        processedContacts.push(contact);
      } catch (error) {
        console.error(`Erro ao processar linha ${index + 1}:`, error);
        errors.push(`Erro ao processar linha ${index + 1}: ${(error as Error).message}`);
      }
    });
    
    // Verificar se há contatos válidos
    if (processedContacts.length === 0) {
      toast.error('Nenhum contato válido encontrado no arquivo.');
      setIsProcessing(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    // Verificar limite de contatos
    if (processedContacts.length > remainingContacts) {
      errors.push(`O arquivo contém ${processedContacts.length} contatos, mas você só pode importar ${remainingContacts} contatos adicionais.`);
    }
    
    setContacts(processedContacts.slice(0, remainingContacts));
    setValidationErrors(errors);
    setImportStatus('preview');
    setIsProcessing(false);
  };
  
  // Função para importar contatos
  const importContacts = async () => {
    try {
      setImportStatus('importing');
      // Garantir organização do usuário
      const orgId = await ensureOrganization();
      // Resolver lista alvo (opcional)
      let listId: string | null = null;
      if (targetListId === 'new') {
        if (!newListName.trim()) {
          toast.error('Informe o nome da nova lista');
          setImportStatus('preview');
          return;
        }
        const { data: createdList, error: createErr } = await supabase
          .from('contact_lists')
          .insert({ user_id: userId, organization_id: orgId, name: newListName.trim() })
          .select('id, name')
          .single();
        if (createErr) throw createErr;
        listId = createdList!.id;
        setLists((prev) => [{ id: createdList!.id, name: createdList!.name }, ...prev]);
        setTargetListId(createdList!.id);
        setNewListName('');
      } else if (targetListId) {
        listId = targetListId;
      }

      // Preparar dados para inserção (normalizando para schema atual)
      const contactsToImport = contacts.map((contact) => {
        const custom_fields: Record<string, any> = {};
        if (contact.email) custom_fields.email = contact.email;
        if (contact.group) custom_fields.group = contact.group;
        if (contact.notes) custom_fields.notes = contact.notes;
        return {
          user_id: userId,
          organization_id: orgId,
          phone: contact.phone,
          name: contact.name || null,
          ...(Object.keys(custom_fields).length ? { custom_fields } : {}),
        } as any;
      });
      
      // Inserir contatos no banco de dados e retornar ids
      const { data: inserted, error } = await supabase
        .from('contacts')
        .insert(contactsToImport)
        .select('id');
      
      if (error) throw error;
      
      // Se houver lista alvo, associar todos os contatos inseridos
      if (listId && inserted && inserted.length > 0) {
        const members = inserted.map((row: any) => ({ contact_id: row.id, list_id: listId }));
        const { error: memberErr } = await supabase
          .from('contact_list_members')
          .upsert(members as any, { onConflict: 'contact_id,list_id', ignoreDuplicates: true } as any);
        if (memberErr) throw memberErr;
      }
      
      toast.success(`${contacts.length} contatos importados com sucesso!`);
      setImportStatus('success');
      
      // Redirecionar para a lista de contatos após 2 segundos
      setTimeout(() => {
        router.push('/contatos');
        router.refresh();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao importar contatos:', error);
      toast.error(error.message || 'Erro ao importar contatos. Tente novamente.');
      setImportStatus('preview');
    }
  };
  
  // Função para cancelar a importação
  const cancelImport = () => {
    setSelectedFile(null);
    setContacts([]);
    setValidationErrors([]);
    setImportStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  return (
    <div className="space-y-6">
      {importStatus === 'idle' && (
        <>
          <div className={compact ? "bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-4 text-center" : "bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"}>
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            {!compact && (
              <>
                <h3 className="mt-2 text-lg font-medium">Arraste e solte seu arquivo aqui</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ou clique para selecionar um arquivo CSV ou Excel (XLSX)
                </p>
              </>
            )}
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mt-3"
              disabled={isUploading}
            >
              {isUploading ? 'Processando...' : 'Selecionar Arquivo'}
            </Button>
          </div>
          {!compact && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Formato do arquivo</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    Seu arquivo deve conter as colunas: Nome e Telefone (obrigatórias), 
                    Email, Grupo e Observações (opcionais).
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {importStatus === 'preview' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">
                Pré-visualização da importação
              </h3>
              <p className="text-sm text-gray-500">
                {contacts.length} contatos encontrados no arquivo
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="flex gap-2 items-center">
                <select
                  value={targetListId}
                  onChange={(e) => setTargetListId(e.target.value)}
                  className="h-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  <option value="">Não adicionar a lista</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                  <option value="new">+ Criar nova lista…</option>
                </select>
                {targetListId === 'new' && (
                  <Input
                    placeholder="Nome da nova lista"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="h-10"
                  />
                )}
              </div>
              <Button variant="outline" onClick={cancelImport}>
                Cancelar
              </Button>
              <Button 
                onClick={importContacts} 
                disabled={contacts.length === 0 || validationErrors.length > 0}
              >
                Importar {contacts.length} contatos
              </Button>
            </div>
          </div>
          
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Erros encontrados</h4>
                  <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-2 px-4 text-left font-medium">#</th>
                  <th className="py-2 px-4 text-left font-medium">Nome</th>
                  <th className="py-2 px-4 text-left font-medium">Telefone</th>
                  <th className="py-2 px-4 text-left font-medium">Email</th>
                  <th className="py-2 px-4 text-left font-medium">Grupo</th>
                </tr>
              </thead>
              <tbody>
                {contacts.slice(0, 10).map((contact, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{index + 1}</td>
                    <td className="py-2 px-4">{contact.name}</td>
                    <td className="py-2 px-4">{contact.phone}</td>
                    <td className="py-2 px-4">{contact.email || '-'}</td>
                    <td className="py-2 px-4">{contact.group || '-'}</td>
                  </tr>
                ))}
                {contacts.length > 10 && (
                  <tr>
                    <td colSpan={5} className="py-2 px-4 text-center text-gray-500">
                      ... e mais {contacts.length - 10} contatos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {importStatus === 'importing' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-medium">Importando contatos...</h3>
          <p className="text-sm text-gray-500 mt-2">
            Isso pode levar alguns instantes. Por favor, aguarde.
          </p>
        </div>
      )}
      
      {importStatus === 'success' && (
        <div className="text-center py-12">
          <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-green-800">Importação concluída com sucesso!</h3>
          <p className="text-sm text-gray-500 mt-2">
            {contacts.length} contatos foram importados. Redirecionando...
          </p>
        </div>
      )}
    </div>
  );
}