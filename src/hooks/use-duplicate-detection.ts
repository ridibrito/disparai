import { useState, useEffect, useMemo } from 'react';

export type Contact = {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  group?: string;
  notes?: string;
};

export type DuplicateGroup = {
  phone: string;
  contacts: Contact[];
};

export function useDuplicateDetection(contacts: Contact[]) {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [hasDuplicates, setHasDuplicates] = useState(false);

  // Detectar duplicados sempre que a lista de contatos mudar
  useEffect(() => {
    if (!contacts || contacts.length === 0) {
      setDuplicates([]);
      setHasDuplicates(false);
      return;
    }

    const phoneGroups: Record<string, Contact[]> = {};
    
    contacts.forEach(contact => {
      const phone = contact.phone;
      if (!phoneGroups[phone]) {
        phoneGroups[phone] = [];
      }
      phoneGroups[phone].push(contact);
    });
    
    // Filtrar apenas grupos com mais de 1 contato
    const foundDuplicates = Object.entries(phoneGroups)
      .filter(([_, contacts]) => contacts.length > 1)
      .map(([phone, contacts]) => ({ phone, contacts }));
    
    setDuplicates(foundDuplicates);
    setHasDuplicates(foundDuplicates.length > 0);
  }, [contacts]);

  // Estatísticas dos duplicados
  const duplicateStats = useMemo(() => {
    if (!hasDuplicates) return null;
    
    const totalDuplicates = duplicates.reduce((sum, group) => sum + group.contacts.length, 0);
    const uniquePhones = duplicates.length;
    
    return {
      totalDuplicates,
      uniquePhones,
      totalContacts: contacts.length,
      duplicatePercentage: Math.round((totalDuplicates / contacts.length) * 100)
    };
  }, [duplicates, hasDuplicates, contacts.length]);

  // Função para resolver duplicados (remover não selecionados)
  const resolveDuplicates = (selectedContacts: Contact[]) => {
    const resolvedPhoneGroups = new Set(selectedContacts.map(c => c.phone));
    
    return contacts.filter(contact => {
      const phoneGroup = duplicates.find(d => d.phone === contact.phone);
      if (!phoneGroup) return true; // Não é duplicado, manter
      
      // Se é duplicado, verificar se foi selecionado
      return selectedContacts.some(resolved => 
        resolved.phone === contact.phone && 
        resolved.name === contact.name
      );
    });
  };

  return {
    duplicates,
    hasDuplicates,
    duplicateStats,
    resolveDuplicates
  };
}
