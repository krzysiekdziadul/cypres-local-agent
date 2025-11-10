// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for data-cy selectors
Cypress.Commands.add('getByCy', (selector, ...args) => {
  return cy.get(`[data-cy=${selector}]`, ...args)
})

// Custom command for data-cy contains
Cypress.Commands.add('getByContains', (selector, text, ...args) => {
  return cy.get(`[data-cy=${selector}]`).contains(text, ...args)
})

// Custom commands for the React login application using data-cy attributes

// Login command for easy authentication in tests
Cypress.Commands.add('login', (email = 'test@test.pl', password = 'test123') => {
  cy.visit('/login')
  cy.getByCy('email-input').type(email)
  cy.getByCy('password-input').type(password)
  cy.getByCy('login-button').click()
  
  // Wait for navigation to dashboard
  cy.url().should('include', '/dashboard')
})

// Logout command
Cypress.Commands.add('logout', () => {
  cy.getByCy('logout-button').click()
  cy.url().should('include', '/login')
})

// Check if user is on login page
Cypress.Commands.add('shouldBeOnLoginPage', () => {
  cy.url().should('include', '/login')
  cy.contains('Welcome Back').should('be.visible')
})

// Check if user is on dashboard page
Cypress.Commands.add('shouldBeOnDashboard', () => {
  cy.url().should('include', '/dashboard')
  cy.getByCy('welcome-message').should('be.visible')
})

// Fill login form without submitting
Cypress.Commands.add('fillLoginForm', (email, password) => {
  cy.getByCy('email-input').type(email)
  cy.getByCy('password-input').type(password)
})

// Submit login form
Cypress.Commands.add('submitLoginForm', () => {
  cy.getByCy('login-button').click()
})

// Check for error message
Cypress.Commands.add('shouldShowError', () => {
  cy.getByCy('error-message').should('be.visible')
})

// Clear all inputs
Cypress.Commands.add('clearInputs', () => {
  cy.getByCy('email-input').clear()
  cy.getByCy('password-input').clear()
})
