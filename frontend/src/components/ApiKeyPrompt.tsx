import { useState, type FormEvent } from 'react';
import { KeyRound, ShieldCheck, User } from 'lucide-react';
import { DEV_PRESETS, useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/atmodesq';

interface ApiKeyPromptProps {
    message?: string;
    onSuccess?: () => void;
}

export function ApiKeyPrompt({ message, onSuccess }: ApiKeyPromptProps) {
    const { apiKey, userRole, setCredentials } = useAuth();
    const [keyInput, setKeyInput] = useState(apiKey);
    const [roleInput, setRoleInput] = useState<UserRole>(userRole);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!keyInput.trim()) return;
        setCredentials(keyInput, roleInput);
        onSuccess?.();
    };

    const applyPreset = (role: UserRole) => {
        const presetKey = DEV_PRESETS[role];
        setKeyInput(presetKey);
        setRoleInput(role);
        setCredentials(presetKey, role);
        onSuccess?.();
    };

    return (
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <KeyRound className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        Přístup do Atmodesq
                    </h2>
                    <p className="text-sm text-slate-500">
                        Zadej svůj API klíč (`x-api-key`) pro komunikaci s backendem.
                    </p>
                </div>
            </div>

            {message && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="api-key-input"
                        className="mb-1 block text-sm font-medium text-slate-700"
                    >
                        API klíč
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="např. dev-admin-key"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        required
                    />
                </div>

                <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Profil oprávnění v UI
          </span>
                    <div className="grid grid-cols-2 gap-2">
                        {(['USER', 'ADMIN'] as UserRole[]).map((role) => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setRoleInput(role)}
                                className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                                    roleInput === role
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {role === 'ADMIN' ? (
                                    <ShieldCheck className="h-4 w-4" />
                                ) : (
                                    <User className="h-4 w-4" />
                                )}
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                    Potvrdit a pokračovat
                </button>
            </form>

            <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Rychlé lokální přihlášení (dev)
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => applyPreset('ADMIN')}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        ADMIN (dev-admin-key)
                    </button>
                    <button
                        type="button"
                        onClick={() => applyPreset('USER')}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                        USER (dev-user-key)
                    </button>
                </div>
            </div>
        </div>
    );
}