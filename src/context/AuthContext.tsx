import { useMemo, type PropsWithChildren } from 'react'
import { useLogin, useLogout, useRegister, useSession } from '../hooks/useAuth'
import { authFieldErrors, describeAuthError, describeLoginError, resolveAuthError } from './authErrors'
import { AuthContext, type AuthContextValue, type RegisterInput } from './authState'

export function AuthProvider({ children }: PropsWithChildren) {
  const { data, isLoading } = useSession()
  const login = useLogin()
  const registration = useRegister()
  const logout = useLogout()

  const user = data?.user ?? null

  // The failure to report is whichever mutation settled with an error, which is
  // a different question from which one is in flight.
  const authError = resolveAuthError(login, registration)
  const isPending = login.isPending || registration.isPending

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAdmin: user?.role === 'admin',
      isCustomer: user !== null && user.role === 'customer',
      isPending,
      error:
        authError === null
          ? null
          : authError.source === 'login'
            ? describeLoginError(authError.error)
            : describeAuthError(authError.error),
      fieldErrors: authFieldErrors(authError?.error, authError?.source ?? 'login'),
      signIn: async (email, password) => {
        const session = await login.login({ email, password })
        return session.user
      },
      register: async (input: RegisterInput) => {
        const session = await registration.register(input)
        return session.user
      },
      signOut: async () => {
        await logout.mutateAsync()
      },
      clearAuthError: () => {
        login.clearError()
        registration.clearError()
      },
    }),
    // The mutation objects are new on every render, which is what the original
    // dependency list relied on too; `authError` alone decides when the message
    // changes, so nothing here can serve a stale one.
    [user, isLoading, isPending, authError, login, registration, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}