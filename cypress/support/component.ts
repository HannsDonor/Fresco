// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import { createElement, type ReactNode } from "react";
import { mount, type MountOptions, type MountReturn } from "cypress/react";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import "../../src/app/globals.css";

type ComponentMountOptions = MountOptions & {
  router?: Partial<AppRouterInstance>;
};

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  // Cypress extends its Chainable interface for the custom mount command.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount(component: ReactNode, options?: ComponentMountOptions): Cypress.Chainable<MountReturn>
    }
  }
}

Cypress.Commands.add("mount", (component: ReactNode, options: ComponentMountOptions = {}) => {
  const { router: routerOverrides, ...mountOptions } = options;
  const router: AppRouterInstance = {
    back: () => undefined,
    forward: () => undefined,
    refresh: () => undefined,
    push: () => undefined,
    replace: () => undefined,
    prefetch: () => undefined,
    bfcacheId: "cypress-component-test",
    ...routerOverrides,
  };
  return mount(
    createElement(AppRouterContext.Provider, { value: router }, component),
    mountOptions
  );
});

// Example use:
// cy.mount(<MyComponent />)
