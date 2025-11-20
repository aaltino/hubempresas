import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/design-system/ui';
import { Alert } from '@/design-system/feedback';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Verificar se ha um token de recuperacao
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Usuario clicou no link de recuperacao
      }
    });
  }, []);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('Minimo de 8 caracteres');
    if (!/[A-Z]/.test(pwd)) errors.push('Pelo menos uma letra maiuscula');
    if (!/[a-z]/.test(pwd)) errors.push('Pelo menos uma letra minuscula');
    if (!/[0-9]/.test(pwd)) errors.push('Pelo menos um numero');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar senha
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Senha invalida: ${passwordErrors.join(', ')}`);
      return;
    }

    // Verificar se as senhas coincidem
    if (password !== confirmPassword) {
      setError('As senhas nao coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirecionar apos 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setError(error.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Senha Redefinida!
            </h2>
            <p className="text-gray-600 mb-6">
              Sua senha foi atualizada com sucesso. Redirecionando para o login...
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-blue-200 rounded-full">
                <div className="h-2 bg-blue-600 rounded-full animate-[progress_3s_linear]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const passwordErrors = password ? validatePassword(password) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Nova Senha
            </h1>
            <p className="text-gray-600">
              Digite sua nova senha abaixo
            </p>
          </div>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Digite sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            {/* Requisitos de senha */}
            {password && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-gray-700">Requisitos da senha:</p>
                {[
                  { text: 'Minimo 8 caracteres', valid: password.length >= 8 },
                  { text: 'Letra maiuscula', valid: /[A-Z]/.test(password) },
                  { text: 'Letra minuscula', valid: /[a-z]/.test(password) },
                  { text: 'Numero', valid: /[0-9]/.test(password) }
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      req.valid ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {req.valid && <CheckCircle className="w-3 h-3 text-green-600" />}
                    </div>
                    <span className={req.valid ? 'text-green-700' : 'text-gray-500'}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Confirme sua nova senha"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-600">As senhas nao coincidem</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || passwordErrors.length > 0 || password !== confirmPassword}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Redefinindo...' : 'Redefinir Senha'}
          </Button>
        </form>
      </div>
    </div>
  );
}
