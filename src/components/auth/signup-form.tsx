'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

export function SignupForm() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (!formData.companyName.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }

    if (!formData.ownerName.trim()) {
      toast.error('Nome do proprietário é obrigatório');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.ownerName,
            company_name: formData.companyName
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Criar registro na tabela users
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: formData.ownerName,
            email: formData.email
          });

        if (userError) throw userError;

        // 3. Criar organização
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: `${formData.companyName} - ${formData.ownerName}`,
            slug: `${formData.companyName.toLowerCase().replace(/\s+/g, '-')}-org`,
            company_name: formData.companyName,
            owner_name: formData.ownerName,
            owner_email: formData.email
          })
          .select('id')
          .single();

        if (orgError) throw orgError;

        // 4. Atualizar usuário com organization_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ organization_id: orgData.id })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;

        // 5. Criar registro em organization_members como owner
        const { error: memberError } = await supabase
          .from('organization_members')
          .insert({
            user_id: authData.user.id,
            organization_id: orgData.id,
            role: 'owner',
            is_active: true
          });

        if (memberError) throw memberError;

        toast.success(`✅ Conta criada com sucesso!\n\nEmpresa: ${formData.companyName}\nProprietário: ${formData.ownerName}\n\nVerifique seu email para confirmar a conta.`);
        
        // Limpar formulário
        setFormData({
          companyName: '',
          ownerName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });

      } else {
        toast.error('Erro ao criar conta');
      }

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error(error.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Logo da empresa */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Criar Conta</h2>
          <p className="text-gray-600 mt-2">Configure sua empresa no disparai</p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-6">
          {/* Nome da Empresa */}
          <div>
            <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
              Nome da Empresa *
            </Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="Ex: Coruss, Minha Empresa Ltda"
              className="mt-1"
              required
            />
          </div>

          {/* Nome do Proprietário */}
          <div>
            <Label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
              Nome do Proprietário *
            </Label>
            <Input
              id="ownerName"
              name="ownerName"
              type="text"
              value={formData.ownerName}
              onChange={handleInputChange}
              placeholder="Ex: Ricardo de brito Albuquerque"
              className="mt-1"
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ricardo@coruss.com"
              className="mt-1"
              required
            />
          </div>

          {/* Senha */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Senha *
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Mínimo 6 caracteres"
              className="mt-1"
              minLength={6}
              required
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirmar Senha *
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Digite a senha novamente"
              className="mt-1"
              required
            />
          </div>

          {/* Botão de Cadastro */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Criando conta...
              </div>
            ) : (
              'Criar Conta da Empresa'
            )}
          </Button>

          {/* Informações adicionais */}
          <div className="text-center text-sm text-gray-500">
            <p>✅ Criação automática da organização</p>
            <p>👑 Você será o Owner da empresa</p>
            <p>🔐 Conta segura com autenticação</p>
          </div>
        </form>
      </div>
    </div>
  );
}
