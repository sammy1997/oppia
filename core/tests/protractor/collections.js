// Copyright 2016 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview End-to-end tests for collections.
 */

var general = require('../protractor_utils/general.js');
var users = require('../protractor_utils/users.js');
var workflow = require('../protractor_utils/workflow.js');
var AdminPage = require('../protractor_utils/AdminPage.js');
var collectionEditor = require('../protractor_utils/collectionEditor.js');
var CreatorDashboardPage =
  require('../protractor_utils/CreatorDashboardPage.js');


describe('Collections', function() {
  var adminPage = null;
  var creatorDashboardPage = null;
  var collectionId = null;
  var firstExplorationId = null;
  var secondExplorationId = null;
  var thirdExplorationId = null;
  var fourthExplorationId = null;

  beforeAll(function() {
    adminPage = new AdminPage.AdminPage();
    creatorDashboardPage = new CreatorDashboardPage.CreatorDashboardPage();
    var EDITOR_USERNAME = 'aliceCollections';
    var PLAYER_USERNAME = 'playerCollections';
    var CREATOR_USERNAME = 'creatorExplorations';
    users.createUser('creator@explorations.com', CREATOR_USERNAME);
    users.createUser('player@collections.com', PLAYER_USERNAME);
    users.createUser('alice@collections.com', EDITOR_USERNAME);
    users.createAndLoginAdminUser('testadm@collections.com', 'testadm');
    adminPage.get();
    adminPage.updateRole(EDITOR_USERNAME, 'collection editor');
    adminPage.updateRole(PLAYER_USERNAME, 'collection editor');
    users.logout();

    users.login('creator@explorations.com');
    // Create four test explorations.
    workflow.createAndPublishExploration(
      'First Exploration',
      'Languages',
      'First Test Exploration.'
    );
    general.getExplorationIdFromEditor().then(function(expId) {
      firstExplorationId = expId;
      workflow.createAndPublishExploration(
        'Second Exploration',
        'Languages',
        'Second Test Exploration.'
      );
      general.getExplorationIdFromEditor().then(function(expId) {
        secondExplorationId = expId;
      });
      workflow.createAndPublishExploration(
        'Third Exploration',
        'Languages',
        'Third Test Exploration.'
      );
      general.getExplorationIdFromEditor().then(function(expId) {
        thirdExplorationId = expId;
      });
      workflow.createAndPublishExploration(
        'Fourth Exploration',
        'Languages',
        'Fourth Test Exploration.'
      );
      general.getExplorationIdFromEditor().then(function(expId) {
        fourthExplorationId = expId;
      });
      // Create searchable explorations.
      workflow.createAndPublishExploration(
        'The Lazy Magician',
        'Algorithms',
        'discover the binary search algorithm'
      );
      workflow.createAndPublishExploration(
        'Root Linear Coefficient Theorem',
        'Algebra',
        'discover the Root Linear Coefficient Theorem'
      );
      workflow.createAndPublishExploration(
        'Test Exploration',
        'Languages',
        'discover the Protractor Testing'
      );
      users.logout();

      users.login('player@collections.com');
      browser.get(general.SERVER_URL_PREFIX);
      var dropdown = element(by.css('.protractor-test-profile-dropdown'));
      browser.actions().mouseMove(dropdown).perform();
      dropdown.element(by.css('.protractor-test-dashboard-link')).click();
      browser.waitForAngular();
      creatorDashboardPage.clickCreateActivityButton();
      creatorDashboardPage.clickCreateCollectionButton();
      browser.getCurrentUrl().then(function(url) {
        var pathname = url.split('/');
        //in the url a # is added at the end that is not part of collection ID
        collectionId = pathname[5].slice(0, -1);
      });
      browser.waitForAngular();
      // Add existing explorations.
      collectionEditor.addExistingExploration(firstExplorationId);
      collectionEditor.saveDraft();
      collectionEditor.closeSaveModal();
      collectionEditor.publishCollection();
      collectionEditor.setTitle('Test Collection 2');
      collectionEditor.setObjective('This is the second test collection.');
      collectionEditor.setCategory('Algebra');
      collectionEditor.saveChanges();
      browser.waitForAngular();
      users.logout();
    });
  });

  it('visits the collection editor', function() {
    users.login('alice@collections.com');
    browser.get(general.SERVER_URL_PREFIX);
    var dropdown = element(by.css('.protractor-test-profile-dropdown'));
    browser.actions().mouseMove(dropdown).perform();
    dropdown.element(by.css('.protractor-test-dashboard-link')).click();
    browser.waitForAngular();
    creatorDashboardPage.clickCreateActivityButton();
    creatorDashboardPage.clickCreateCollectionButton();
    browser.waitForAngular();
    // Add existing explorations.
    collectionEditor.addExistingExploration(firstExplorationId);
    collectionEditor.addExistingExploration(secondExplorationId);
    collectionEditor.addExistingExploration(thirdExplorationId);
    // Search and add existing explorations.
    collectionEditor.searchForAndAddExistingExploration('Lazy');
    collectionEditor.searchForAndAddExistingExploration('Linear');
    collectionEditor.searchForAndAddExistingExploration('Testing');
    // Shifting nodes in the node graph.
    collectionEditor.shiftNodeLeft(1);
    collectionEditor.shiftNodeRight(1);
    // Delete node in the node graph.
    collectionEditor.deleteNode(1);
    // Publish the collection.
    collectionEditor.saveDraft();
    collectionEditor.closeSaveModal();
    collectionEditor.publishCollection();
    collectionEditor.setTitle('Test Collection');
    collectionEditor.setObjective('This is a test collection.');
    collectionEditor.setCategory('Algebra');
    collectionEditor.saveChanges();
    browser.waitForAngular();
    users.logout();
  });

  it('visits the collection player', function() {
    users.login('alice@collections.com');
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    users.logout();
  });

  it('checks for errors in a collection with varying node count', function() {
    // Checking in a collection with one node.
    users.login('player@collections.com');
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);

    // Checking in a collection with two nodes.
    browser.get('/collection_editor/create/' + collectionId);
    browser.waitForAngular();
    collectionEditor.addExistingExploration(secondExplorationId);
    collectionEditor.saveDraft();
    collectionEditor.setCommitMessage('Add Exploration');
    collectionEditor.closeSaveModal();
    browser.waitForAngular();
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);

    // Checking in a collection with three nodes.
    browser.get('/collection_editor/create/' + collectionId);
    browser.waitForAngular();
    collectionEditor.addExistingExploration(thirdExplorationId);
    collectionEditor.saveDraft();
    collectionEditor.setCommitMessage('Add Exploration');
    collectionEditor.closeSaveModal();
    browser.waitForAngular();
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);

    // Checking in a collection with four nodes.
    browser.get('/collection_editor/create/' + collectionId);
    browser.waitForAngular();
    collectionEditor.addExistingExploration(fourthExplorationId);
    collectionEditor.saveDraft();
    collectionEditor.setCommitMessage('Add Exploration');
    collectionEditor.closeSaveModal();
    browser.waitForAngular();
    browser.get('/collection/' + collectionId);
    browser.waitForAngular();
    general.checkForConsoleErrors([]);
    users.logout();
  });

  afterEach(function() {
    general.checkForConsoleErrors([]);
  });
});
