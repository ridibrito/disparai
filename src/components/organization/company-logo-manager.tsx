'use client';

import { useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

type CompanyLogoManagerProps = {
  organizationId: string;
  currentLogoUrl?: string;
  currentLogoText?: string;
  companyName: string;
  onLogoUpdate: (logoUrl: string, logoText: string) => void;
};

export function CompanyLogoManager({ 
  organizationId, 
  currentLogoUrl, 
  currentLogoText, 
  companyName,
  onLogoUpdate 
}: CompanyLogoManagerProps) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl || '');
  const [logoText, setLogoText] = useState(currentLogoText || companyName.charAt(0).toUpperCase());
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    setLoading(true);
    try {
      // Upload para Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}-logo.${fileExt}`;
      const filePath = `company-logos/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);
      
      // Atualizar no banco
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organizationId);
      
      if (updateError) throw updateError;
      
      setLogoUrl(publicUrl);
      onLogoUpdate(publicUrl, logoText);
      toast.success('Logo atualizada com sucesso!');
      setShowUpload(false);
      
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload da logo');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoTextUpdate = async () => {
    if (!logoText.trim()) {
      toast.error('Texto da logo não pode estar vazio');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ logo_text: logoText.trim() })
        .eq('id', organizationId);
      
      if (error) throw error;
      
      onLogoUpdate(logoUrl, logoText.trim());
      toast.success('Texto da logo atualizado!');
      
    } catch (error: any) {
      console.error('Erro ao atualizar texto:', error);
      toast.error('Erro ao atualizar texto da logo');
    } finally {
      setLoading(false);
    }
  };

  const removeLogo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organizationId);
      
      if (error) throw error;
      
      setLogoUrl('');
      onLogoUpdate('', logoText);
      toast.success('Logo removida!');
      
    } catch (error: any) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Logo da Empresa</h3>
      
      {/* Logo Atual */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Logo Atual
        </Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <Image 
                src={logoUrl} 
                alt={`Logo ${companyName}`}
                width={64} 
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
              {logoText}
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowUpload(!showUpload)}
              variant="outline"
              size="sm"
            >
              {logoUrl ? 'Alterar Logo' : 'Adicionar Logo'}
            </Button>
            {logoUrl && (
              <Button
                onClick={removeLogo}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remover
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Upload de Logo */}
      {showUpload && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Upload de Nova Logo
          </Label>
          <div className="flex gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
            >
              Escolher Arquivo
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Formatos: JPG, PNG, GIF. Tamanho máximo: 2MB
          </p>
        </div>
      )}

      {/* Texto da Logo */}
      <div className="mb-4">
        <Label htmlFor="logoText" className="text-sm font-medium text-gray-700 mb-2 block">
          Texto da Logo (Fallback)
        </Label>
        <div className="flex gap-2">
          <Input
            id="logoText"
            value={logoText}
            onChange={(e) => setLogoText(e.target.value)}
            placeholder="Ex: C (para Coruss)"
            maxLength={3}
            className="flex-1"
          />
          <Button
            onClick={handleLogoTextUpdate}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Texto que aparece quando não há logo (máximo 3 caracteres)
        </p>
      </div>

      {/* Preview */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Preview
        </Label>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg font-bold mb-2">
              {logoText}
            </div>
            <span className="text-xs text-gray-500">Pequeno</span>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold mb-2">
              {logoText}
            </div>
            <span className="text-xs text-gray-500">Médio</span>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-3xl font-bold mb-2">
              {logoText}
            </div>
            <span className="text-xs text-gray-500">Grande</span>
          </div>
        </div>
      </div>
    </div>
  );
}
