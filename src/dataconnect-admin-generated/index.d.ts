import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface Application_Key {
  id: UUIDString;
  __typename?: 'Application_Key';
}

export interface ApplyToPartyData {
  application_insert: Application_Key;
}

export interface ApplyToPartyVariables {
  partyId: UUIDString;
  partyRoleId: UUIDString;
  applicationMessage: string;
}

export interface CreatePartyData {
  party_insert: Party_Key;
}

export interface CreatePartyVariables {
  hostId: UUIDString;
  dateTime: TimestampString;
  description: string;
  location: string;
  partyType: string;
  title: string;
}

export interface GetMyApplicationsData {
  applications: ({
    id: UUIDString;
    party: {
      id: UUIDString;
      title: string;
    } & Party_Key;
      partyRole: {
        id: UUIDString;
        roleName: string;
      } & PartyRole_Key;
        applicationMessage?: string | null;
        createdAt: TimestampString;
        status: string;
  } & Application_Key)[];
}

export interface GetPartiesData {
  parties: ({
    id: UUIDString;
    hostId: UUIDString;
    dateTime: TimestampString;
    description: string;
    location: string;
    maxParticipants?: number | null;
    partyType: string;
    title: string;
  } & Party_Key)[];
}

export interface Participation_Key {
  id: UUIDString;
  __typename?: 'Participation_Key';
}

export interface PartyRole_Key {
  id: UUIDString;
  __typename?: 'PartyRole_Key';
}

export interface Party_Key {
  id: UUIDString;
  __typename?: 'Party_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateParty' Mutation. Allow users to execute without passing in DataConnect. */
export function createParty(dc: DataConnect, vars: CreatePartyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreatePartyData>>;
/** Generated Node Admin SDK operation action function for the 'CreateParty' Mutation. Allow users to pass in custom DataConnect instances. */
export function createParty(vars: CreatePartyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreatePartyData>>;

/** Generated Node Admin SDK operation action function for the 'GetParties' Query. Allow users to execute without passing in DataConnect. */
export function getParties(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetPartiesData>>;
/** Generated Node Admin SDK operation action function for the 'GetParties' Query. Allow users to pass in custom DataConnect instances. */
export function getParties(options?: OperationOptions): Promise<ExecuteOperationResponse<GetPartiesData>>;

/** Generated Node Admin SDK operation action function for the 'ApplyToParty' Mutation. Allow users to execute without passing in DataConnect. */
export function applyToParty(dc: DataConnect, vars: ApplyToPartyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ApplyToPartyData>>;
/** Generated Node Admin SDK operation action function for the 'ApplyToParty' Mutation. Allow users to pass in custom DataConnect instances. */
export function applyToParty(vars: ApplyToPartyVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<ApplyToPartyData>>;

/** Generated Node Admin SDK operation action function for the 'GetMyApplications' Query. Allow users to execute without passing in DataConnect. */
export function getMyApplications(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyApplicationsData>>;
/** Generated Node Admin SDK operation action function for the 'GetMyApplications' Query. Allow users to pass in custom DataConnect instances. */
export function getMyApplications(options?: OperationOptions): Promise<ExecuteOperationResponse<GetMyApplicationsData>>;

