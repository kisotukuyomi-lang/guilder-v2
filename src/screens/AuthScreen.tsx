import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setMessage('確認メールを送信しました。メールを確認してログインしてください。')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-guilder-bg px-6 dark:bg-guilder-dark-bg">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-3xl font-bold tracking-[0.2em] text-gold">GUILDER</h1>
        <p className="mb-8 text-center text-sm text-gray-500 dark:text-gray-400">
          旅の記憶を地図に刻む
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-guilder-border bg-white px-4 py-3 text-sm outline-none focus:border-gold dark:border-guilder-dark-border dark:bg-guilder-dark-card"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-guilder-border bg-white px-4 py-3 text-sm outline-none focus:border-gold dark:border-guilder-dark-border dark:bg-guilder-dark-card"
              placeholder="6文字以上"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-gold">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gold py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? '処理中...' : mode === 'signin' ? 'ログイン' : '新規登録'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin')
            setError(null)
            setMessage(null)
          }}
          className="mt-6 w-full text-center text-sm text-gray-500 underline dark:text-gray-400"
        >
          {mode === 'signin' ? 'アカウントを作成' : 'ログインに戻る'}
        </button>
      </div>
    </div>
  )
}
