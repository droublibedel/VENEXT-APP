"use client";

import { createContext, useContext, type ReactNode } from "react";

import type {
  CommercialContextRoutingInput,
  ProducerWorkspaceTabDestination,
} from "commercial-context-routing";

export type ProducerCommercialRoutingValue = {
  routingInput: CommercialContextRoutingInput;
  relationalTab?: ProducerWorkspaceTabDestination;
  setRelationalTab?: (tab: ProducerWorkspaceTabDestination) => void;
  canGoBack?: boolean;
  goBack?: () => void;
};

const ProducerCommercialRoutingContext = createContext<ProducerCommercialRoutingValue>({
  routingInput: {},
});

export function ProducerCommercialRoutingProvider({
  value,
  children,
}: {
  value: ProducerCommercialRoutingValue;
  children: ReactNode;
}) {
  return (
    <ProducerCommercialRoutingContext.Provider value={value}>
      {children}
    </ProducerCommercialRoutingContext.Provider>
  );
}

export function useProducerCommercialRouting(): ProducerCommercialRoutingValue {
  return useContext(ProducerCommercialRoutingContext);
}
