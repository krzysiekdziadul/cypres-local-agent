describe('Context', () => {
  beforeEach(() => {
    cy.visit('/context');
  });

  it('should navigate to the context page', () => {
    cy.get('#context-page').should('be.visible');
  });
})