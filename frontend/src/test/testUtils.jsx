import React from 'react'
import { render } from '@testing-library/react'

import { ThemeProvider } from '../context/ThemeContext'

export function renderWithTheme(ui, options) {
	function Wrapper({ children }) {
		return <ThemeProvider>{children}</ThemeProvider>
	}

	return render(ui, { wrapper: Wrapper, ...options })
}
