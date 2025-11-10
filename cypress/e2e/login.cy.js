describe('Login Form Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Should allow user to login with valid credentials', () => {
    // Enter email in the email input field
    cy.get('[data-cy="email-input"]').type('test@test.pl');
    
    // Enter password in the password input field
    cy.get('[data-cy="password-input"]').type('test123');
    
    // Click the login button
    cy.get('[data-cy="login-button"]').click();
    
    // Verify that user is redirected to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify that welcome message appears (indicates successful login)
    cy.get('[data-cy="welcome-message"]').should('be.visible');
  });

  // it('Should display an error message if login credentials are invalid', () => {
  //   cy.get('[data-cy="email-input"]').type('invalid@test.pl');
  //   cy.get('[data-cy="password-input"]').type('invalid123');
  //   cy.get('[data-cy="login-button"]').click();
  //   cy.get('[data-cy="error-message"]').should('be.visible');
  // });
})