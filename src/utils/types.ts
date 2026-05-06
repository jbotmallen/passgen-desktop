import type { ReactNode } from 'react';

export interface Entry {
  id: string;
  title: string;
  username: string;
  website_url: string;
  strength: 'Weak' | 'Medium' | 'Strong';
  icon: string;
  category: string;
  is_favorite: boolean;
  tags?: string;
  password?: string;
  totp?: string;
  notes?: string;
  encrypted_password?: string;
  encrypted_totp_seed?: string;
  encrypted_notes?: string;
  encrypted_fields?: string;
  updated_at?: string;
}

export interface CharsetOption {
  id: string;
  label: string;
  chars: string;
  enabled: boolean;
  icon: ReactNode;
}

export interface GeneratorMode {
  id: string;
  label: string;
  desc: string;
  icon: ReactNode;
}

export interface GeneratorGuide {
  title: string;
  body: string;
}

export interface Vault {
  id: string;
  name: string;
  icon: string;
  itemCount: number;
}

