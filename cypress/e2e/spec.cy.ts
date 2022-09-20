import { getConfirmNewPasswordField, getCreateMap, getCurrNameField, getDashboard, getDisplayedNameField, getLoginButton, getLoginEmailInput, getLoginEmailPrompt, getLoginPasswordInput, getLoginPasswordPrompt, getLogoutButton, getMapCatalogue, getNameEdit, getNavAccount, getNewNameField, getNewPasswordField, getPasswordEdit, getSaveNewNameButton, getSaveNewPasswordButton } from './app.po';

const username = Cypress.env('VALID_USERNAME');
const password = Cypress.env('VALID_PASSWORD');

// Testing Quality Requirements
describe('Testing Performance Quality Requirements', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 15000);
    cy.visit('/login');
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
  });

  //tests time from login button click till dashboard page is loaded
  it.only('Must login within 10 seconds', () => {
    let start = new Date().getTime();//performance.now();

    getLoginButton().click();
    cy.url().should('include', 'dashboard').then(() => {
      cy.wrap(new Date().getTime()).then(end => {   // this is now a queued command which will
        // only run after the previous command
        const duration = end - start;
        cy.log(`Login took ${duration} milliseconds`).then(() => {
          expect(duration < 10000).to.be.true;
        });
      })
    });
  });

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });
});

// Testing Login

describe('Logging the user in', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 10000);
    cy.visit('/login');
  });

  it('Visits the initial project landing page', () => {
    cy.url().should('include', '/login');
  })

  it.only('displays "Please enter password" and "Please enter email" when no password and email are entered', () => {
    getLoginButton().click();
    getLoginPasswordPrompt().should('be.visible');
    getLoginEmailPrompt().should('be.visible');
  });

  it.only('does not navigate to the Dashboard page when no password and email are entered', () => {
    getLoginButton().click();
    cy.url().should('include', '/login')
  });

  it.only('does not navigate to the Dashboard page when an incorrect password and email are entered', () => {
    getLoginEmailInput().type('wrong@email.com');
    getLoginPasswordInput().type('12345689898');

    getLoginButton().click();
    cy.url().should('include', '/login')
  });

  it.only('logs in and navigates to the Dashboard page', () => {
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
    getLoginButton().click();

    cy.url().should('include', '/dashboard')
  });

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });

});

// Testing Navigation

describe('Navigation', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 15000);
    cy.visit('/login');
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
    getLoginButton().click();
  });

  it.only('navigates to the account page', () => {
    cy.wait(3000); //for spinner
    getNavAccount().click();
    cy.url().should('include', '/account');
  });

  it.only('navigates to the dashboard page', () => {
    cy.wait(3000).then(() => {
      getDashboard().click();
      cy.url().should('include', '/dashboard');
    });
  });

  it.only('navigates to the map catalogue page', () => {
    cy.wait(4000).then(() => {
      getMapCatalogue().click();
      cy.url().should('include', '/map-catalogue');
    });
  });

  it.only('navigates to the create map page', () => {
    cy.wait(3000).then(() => {
      getCreateMap().click();
      cy.url().should('include', '/create-map');
    });
  });

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });
});

// Testing File Upload Page

describe('File Upload', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 10000);
    cy.visit('/login');
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
    getLoginButton().click();
  });
  //it.only('displays the ')

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });
});

// Testing Map-Catalogue Page

// Testing Account Page
describe('Testing Account Page functions', () => {
  beforeEach(() => {
    cy.visit('/login');
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
    getLoginButton().click();
    getNavAccount().click();
  });
});

// Testing Logout

describe('Account Page', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 20000);
    cy.visit('/login');
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
    getLoginButton().click();
    cy.wait(500);
    getNavAccount().click();
  });

  it.only("successfully changes the user's name", () => {
    getNameEdit().click();
    getNewNameField().type('New Name');
    getSaveNewNameButton().click();
    cy.wait(500);
    getDisplayedNameField().should('have.value', 'New Name');
  });

  it.only("successfully changes the user's password", (done) => {
    getPasswordEdit().click();
    getNewPasswordField().type(password);
    getConfirmNewPasswordField().type(password);
    getSaveNewPasswordButton().click();
    done();
  });

  // it.only("successfully changes the user's email", () => {
  //   getLogoutButton().click();
  //   cy.url().should('include', '/login');
  // });

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });
});

describe('Logging the user out', () => {
  beforeEach(() => {
    Cypress.config('defaultCommandTimeout', 10000);
    cy.visit('/login');
    getLoginEmailInput().type(username);
    getLoginPasswordInput().type(password);
    getLoginButton().click();
  });

  it('logs the user out', () => {
    getLogoutButton().click();
    cy.url().should('include', '/login');
  });

  afterEach(() => {
    Cypress.config('defaultCommandTimeout', 4000);
  });
});
