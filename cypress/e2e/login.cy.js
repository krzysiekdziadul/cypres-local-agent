describe('Login Form Tests', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Should allow user to login with valid credentials', () => {
    cy.get('input[name="email"]').type('test@test.pl');
    cy.get('input[name="password"]').type('test123');
    cy.contains('Submit').click();
    cy.contains('Welcome Back').should('be.visible');
  });

  // it('Should display an error message if login credentials are invalid', () => {
  //   cy.get('input[name="email"]').type('invalid@test.pl');
  //   cy.get('input[name="password"]').type('invalid123');
  //   cy.contains('Submit').click();
  //   cy.contains('Invalid email or password').should('be.visible');
  // });
})