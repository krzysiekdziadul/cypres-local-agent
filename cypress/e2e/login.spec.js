describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should log in with valid user credentials', () => {
    // Load user data from fixtures/users.json
    cy.fixture('users').then((userData) => {
      // Fill out the login form with user data
      cy.get('#username').type(userData.username);
      cy.get('#password').type(userData.password);

      // Submit the login form
      cy.contains('Login').click();

      // Verify that the user is logged in successfully
      cy.url().should('include', '/dashboard');
    });
  });

  it('should handle invalid credentials', () => {
    // Load user data from fixtures/users.json
    cy.fixture('users').then((userData) => {
      // Fill out the login form with invalid credentials
      cy.get('#username').type(userData.username);
      cy.get('#password').type(userData.invalidPassword);

      // Submit the login form
      cy.contains('Login').click();

      // Verify that an error message is displayed
      cy.contains('Invalid username or password');
    });
  });

  it('should handle empty credentials', () => {
    // Load user data from fixtures/users.json
    cy.fixture('users').then((userData) => {
      // Fill out the login form with empty credentials
      cy.get('#username').type('');
      cy.get('#password').type('');

      // Submit the login form
      cy.contains('Login').click();

      // Verify that an error message is displayed
      cy.contains('Username and password are required');
    });
  });
})