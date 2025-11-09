// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Example custom command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-cy="email"]').type(email)
  cy.get('[data-cy="password"]').type(password)
  cy.get('[data-cy="login-button"]').click()
})

// Example command for API calls
Cypress.Commands.add('apiLogin', (credentials) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: credentials
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token)
  })
})
