import {describe, it, expect} from 'vitest'
import {render, screen} from '@testing-library/react'
import {MemoryRouter, Route, Routes} from 'react-router'
import {AuthStateContext} from '../../context/auth/context'
import type {AuthState} from '../../context/auth/types'
import {ProtectedRoute} from './ProtectedRoute'

const renderWithAuth = (authState: AuthState, initialPath: string) =>
  render(
    <AuthStateContext.Provider value={authState}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/secret" element={<div>secret payload</div>} />
          </Route>
          <Route path="/login" element={<div>login page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthStateContext.Provider>
  )

describe('ProtectedRoute', () => {
  it('renders the child route when the user is authenticated', () => {
    renderWithAuth({isAuthenticated: true, token: 'tkn'}, '/secret')
    expect(screen.getByText('secret payload')).toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to /login', () => {
    renderWithAuth({isAuthenticated: false, token: undefined}, '/secret')
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret payload')).not.toBeInTheDocument()
  })
})
