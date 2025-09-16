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
import { Upload, FileText, AlertCircle, Check, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useImport } from '@/contexts/import-context';
import { WhatsAppLoading } from '@/components/ui/whatsapp-loading';
import { DuplicateResolutionModal } from './duplicate-resolution-modal';
import { useDuplicateDetection } from '@/hooks/use-duplicate-detection';

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
  const cancelRef = useRef(false);
  const { startImport, updateProgress, completeImport, cancelImport: cancelImportGlobal } = useImport();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileType, setFileType] = useState<'csv' | 'xlsx'>('csv');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'preview' | 'importing' | 'success'>('idle');
  
  // Estados para progresso e feedback
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [canCancel, setCanCancel] = useState(false);
  
  // Estados para duplicados
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const { duplicates, hasDuplicates, duplicateStats, resolveDuplicates } = useDuplicateDetection(contacts);
  
  // Verificação periódica em background (sem interface visual)
  useEffect(() => {
    if (!contacts.length) return;
    
    // Verificar duplicados a cada 15 minutos durante importação
    const interval = setInterval(() => {
      if (hasDuplicates && duplicateStats) {
        console.log(`🔍 [${new Date().toLocaleTimeString()}] Verificação periódica durante importação: ${duplicates.length} grupos de duplicados encontrados`);
        
        // Mostrar toast amarelo informativo
        toast(
          (t) => (
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0">⚠️</div>
              <div className="flex-1">
                <div className="font-medium text-yellow-800 mb-1">
                  Duplicados detectados!
                </div>
                <div className="text-sm text-yellow-700 mb-2">
                  {duplicateStats.uniquePhones} telefones com múltiplos contatos 
                  ({duplicateStats.totalDuplicates} contatos duplicados)
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    toast.dismiss(t.id);
                    setShowDuplicateModal(true);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
                >
                  Resolver Duplicados
                </Button>
              </div>
            </div>
          ),
          {
            duration: 10000,
            icon: null,
            style: {
              background: '#fefce8',
              border: '1px solid #fbbf24',
              color: '#92400e'
            }
          }
        );
      }
    }, 15 * 60 * 1000); // 15 minutos
    
    // Cleanup
    return () => clearInterval(interval);
  }, [contacts.length, hasDuplicates, duplicates, duplicateStats]);
  
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

  // Função para cancelar o processamento
  const handleCancelProcessing = () => {
    cancelRef.current = true;
    setCanCancel(false);
    setProcessingStep('Cancelando...');
    
    // Cancelar importação global
    cancelImportGlobal();
  };

  // Função para lidar com a seleção de arquivo
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleFileSelect chamado');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('Nenhum arquivo selecionado');
      return;
    }
    
    console.log('Arquivo selecionado:', file.name, file.type, file.size);
    setSelectedFile(file);
    setIsUploading(true);
    
    // Determinar o tipo de arquivo
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('Extensão do arquivo:', fileExtension);
    
    if (fileExtension === 'csv') {
      console.log('Processando arquivo CSV...');
      setFileType('csv');
      parseCSV(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      console.log('Processando arquivo Excel...');
      setFileType('xlsx');
      parseExcel(file);
    } else {
      console.log('Formato não suportado:', fileExtension);
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
    console.log('Dados brutos recebidos:', data);
    console.log('Número de linhas:', data.length);
    
    // Verificar se os cabeçalhos estão corretos
    if (data.length > 0) {
      const firstRow = data[0];
      const availableHeaders = Object.keys(firstRow);
      const hasName = availableHeaders.some(h => 
        ['name', 'nome', 'fullname', 'full name', 'nome completo'].includes(h.toLowerCase())
      );
      const hasPhone = availableHeaders.some(h => 
        ['phone', 'telefone', 'celular', 'mobile', 'whatsapp', 'número', 'number'].includes(h.toLowerCase())
      );
      
      if (!hasName || !hasPhone) {
        const missingFields = [];
        if (!hasName) missingFields.push('nome');
        if (!hasPhone) missingFields.push('telefone');
        
        toast.error(`Cabeçalhos necessários não encontrados: ${missingFields.join(', ')}. 
          Use: 'nome' ou 'name' para o nome, 'telefone' ou 'phone' para o telefone. 
          Cabeçalhos disponíveis: ${availableHeaders.join(', ')}`);
        
        setIsProcessing(false);
        setCanCancel(false);
        setProcessingProgress(0);
        setProcessingStep('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }
    
    // Após validação dos cabeçalhos, iniciar processamento visual
    setIsProcessing(true);
    setCanCancel(true);
    setTotalRows(data.length);
    setProcessedRows(0);
    setProcessingStep('Processando contatos...');
    setProcessingProgress(0);
    
    // Iniciar importação global para barra flutuante
    startImport(selectedFile?.name || 'Arquivo', data.length);
    
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
          const originalKey = Object.keys(obj).find(k => k.toLowerCase() === matchedKey);
          return originalKey;
        }
      }
      return undefined;
    };
    
    // Função para processar uma linha
    const processRow = (row: any, index: number): Contact | null => {
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
          return null;
        }
        
        if (!phoneKey || !row[phoneKey]) {
          errors.push(`Linha ${index + 1}: Telefone não encontrado ou vazio`);
          return null;
        }
        
        // Formatar o telefone
        let phone = String(row[phoneKey]).replace(/\s+/g, '').replace(/[()\-]/g, '');
        if (!phone.startsWith('+')) {
          phone = `+${phone}`;
        }
        
        // Validar formato do telefone
        if (!/^\+?[0-9]+$/.test(phone)) {
          errors.push(`Linha ${index + 1}: Formato de telefone inválido: ${phone}`);
          return null;
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
        
        return contact;
      } catch (error) {
        console.error(`Erro ao processar linha ${index + 1}:`, error);
        errors.push(`Erro ao processar linha ${index + 1}: ${(error as Error).message}`);
        return null;
      }
    };
    
    // Processar em chunks para não bloquear a UI
    const processChunk = (startIndex: number, chunkSize: number = 100) => {
      const endIndex = Math.min(startIndex + chunkSize, data.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const contact = processRow(data[i], i);
        if (contact) {
          processedContacts.push(contact);
        }
      }
      
      // Atualizar progresso real
      const progress = Math.round((endIndex / data.length) * 100);
      setProcessingProgress(progress);
      setProcessedRows(endIndex);
      setProcessingStep(`Processando linha ${endIndex} de ${data.length}...`);
      
      // Atualizar progresso global para barra flutuante
      updateProgress(progress, `Processando linha ${endIndex} de ${data.length}...`, endIndex);
      
      // Se ainda há mais linhas para processar
      if (endIndex < data.length) {
        // Usar setTimeout para não bloquear a UI e permitir navegação
        setTimeout(() => {
          if (cancelRef.current) {
            console.log('Processamento cancelado pelo usuário');
            setIsProcessing(false);
            setCanCancel(false);
            setProcessingProgress(0);
            setProcessingStep('');
            return;
          }
          processChunk(endIndex, chunkSize);
        }, 10); // Pequeno delay para não sobrecarregar
      } else {
        // Processamento concluído
        
        // Verificar se há contatos válidos
        if (processedContacts.length === 0) {
          setProcessingStep('Nenhum contato válido encontrado');
          setProcessingProgress(100);
          setTimeout(() => {
            toast.error('Nenhum contato válido encontrado no arquivo.');
            setIsProcessing(false);
            setCanCancel(false);
            setProcessingProgress(0);
            setProcessingStep('');
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }, 1000);
          return;
        }
        
        // Verificar limite de contatos
        if (processedContacts.length > remainingContacts) {
          errors.push(`O arquivo contém ${processedContacts.length} contatos, mas você só pode importar ${remainingContacts} contatos adicionais.`);
        }
        
        setProcessingStep('Processamento concluído!');
        setProcessingProgress(100);
        
        setTimeout(() => {
          const contactsToShow = processedContacts.slice(0, remainingContacts);
          setContacts(contactsToShow);
          setValidationErrors(errors);
          
          // Se há duplicados, mostrar toast informativo
          if (duplicates.length > 0) {
            const totalDuplicates = duplicates.reduce((sum, group) => sum + group.contacts.length, 0);
            toast.success(
              `${contactsToShow.length} contatos processados! ${duplicates.length} grupos de duplicados encontrados (${totalDuplicates} contatos duplicados). Clique em "Resolver Duplicados" para continuar.`,
              { duration: 8000 }
            );
          }
          
          setImportStatus('preview');
          setIsProcessing(false);
          setCanCancel(false);
          setProcessingProgress(0);
          setProcessingStep('');
          
          // Concluir importação global
          completeImport();
        }, 1000);
      }
    };
    
    // Iniciar processamento em chunks imediatamente
    processChunk(0, 100); // Processar 100 linhas por vez
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
          <div className="flex items-center gap-2">
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
              className="inline-flex items-center h-11 px-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-primary-light)]"
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? (
                <>
                  <WhatsAppLoading size="sm" />
                  Processando...
                </>
              ) : (
                'Importar Contatos'
              )}
            </Button>
          </div>
          {!compact && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <FileText className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Formato do arquivo</h4>
                  <p className="mt-1 text-sm text-blue-700">
                    <strong>Cabeçalhos obrigatórios:</strong> Nome (ou "name") e Telefone (ou "phone")
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    <strong>Cabeçalhos opcionais:</strong> Email, Grupo, Observações
                  </p>
                  <p className="mt-2 text-xs text-blue-600">
                    Exemplos de cabeçalhos válidos: "Nome", "name", "Telefone", "phone", "telefone", "celular"
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-blue-800 mb-2">
              Processando arquivo...
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              {processingStep}
            </p>
            
            {/* Barra de progresso */}
            <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            
            {/* Contador de progresso */}
            <div className="flex justify-between text-xs text-blue-600 mb-4">
              <span>Linha {processedRows} de {totalRows}</span>
              <span>{processingProgress}%</span>
            </div>
            
            {/* Botão de cancelar */}
            {canCancel && (
              <Button
                onClick={handleCancelProcessing}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancelar Processamento
              </Button>
            )}
          </div>
        </div>
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
                {duplicates.length > 0 && (
                  <span className="ml-2 text-orange-600 font-medium">
                    • {duplicates.length} grupos de duplicados detectados
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              {/* Botão Resolver Duplicados */}
              {duplicates.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowDuplicateModal(true)}
                  className="border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Resolver Duplicados ({duplicates.length})
                </Button>
              )}
              
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

      {showDuplicateModal && (
        <DuplicateResolutionModal
          isOpen={showDuplicateModal}
          duplicates={duplicates}
          onClose={() => setShowDuplicateModal(false)}
          onResolve={(resolvedContacts) => {
            // Atualizar a lista de contatos removendo os duplicados não selecionados
            const resolvedPhoneGroups = new Set(resolvedContacts.map(c => c.phone));
            const updatedContacts = contacts.filter(contact => {
              const phoneGroup = duplicates.find(d => d.phone === contact.phone);
              if (!phoneGroup) return true; // Não é duplicado, manter
              
              // Se é duplicado, verificar se foi selecionado
              return resolvedContacts.some(resolved => 
                resolved.phone === contact.phone && 
                resolved.name === contact.name
              );
            });
            
            setContacts(updatedContacts);
            setDuplicates([]);
            setShowDuplicateModal(false);
            
            const removedCount = contacts.length - updatedContacts.length;
            toast.success(`${resolvedContacts.length} contatos únicos mantidos, ${removedCount} duplicados removidos.`);
          }}
        />
      )}
    </div>
  );
}