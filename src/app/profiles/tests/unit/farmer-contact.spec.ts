import { provideHttpClient, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { FarmerProfilesApiEndpoint } from '../../infrastructure/endpoints/farmer-profiles.endpoint';

import { UpdateFarmerAccountCommand } from '../../domain/model/commands/update-farmer-account.command';
import { FarmerProfileAssembler } from '../../infrastructure/assemblers/farmer-profile.assembler';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfilesStore } from '../../application/profiles.store';
import { ProfilesApi } from '../../infrastructure/profiles-api';
import { FarmerProfile } from '../../domain/model/entities/farmer-profile.entity';

describe('Farmer contact persistence', () => {
  let store: ProfilesStore;
  let response: Subject<FarmerProfile>;
  let original: FarmerProfile;
  let api: {
    getFarmerProfile: ReturnType<typeof vi.fn>;
    updateFarmerProfile: ReturnType<typeof vi.fn>;
  };
  const command = () =>
    new UpdateFarmerAccountCommand({
      firstName: 'Pedro',
      lastName: 'García',
      phoneNumber: '987654321',
    });

  beforeEach(() => {
    original = new FarmerProfile({
      id: 1,
      userId: 1,
      phoneNumber: '912345678',
      email: 'old@example.com',
    });
    response = new Subject<FarmerProfile>();
    api = {
      getFarmerProfile: vi.fn(() => of(original)),
      updateFarmerProfile: vi.fn(() => response),
    };
    TestBed.configureTestingModule({
      providers: [ProfilesStore, { provide: ProfilesApi, useValue: api }],
    });
    store = TestBed.inject(ProfilesStore);
    store.loadFarmerProfile(1);
  });

  it('confirms only after the API returns and does not change the loaded profile while pending', () => {
    store.saveAccount(command());
    expect(store.saving()).toBe(true);
    expect(store.contactSaved()).toBe(false);
    expect(store.profile()?.email).toBe('old@example.com');
    response.next(api.updateFarmerProfile.mock.calls[0][0]);
    response.complete();
    expect(store.contactSaved()).toBe(true);
    expect(store.profile()?.phoneNumber).toBe('987654321');
    expect(store.profile()?.email).toBe('old@example.com');
    expect(store.saving()).toBe(false);
  });

  it('keeps the original profile and reports failure when the API rejects the update', () => {
    store.saveAccount(command());
    response.error(new Error('Connection failed'));
    expect(store.contactSaved()).toBe(false);
    expect(store.profile()).toBe(original);
    expect(original.email).toBe('old@example.com');
    expect(store.error()).toBe('Connection failed');
    expect(store.saving()).toBe(false);
  });

  it('does not submit a second update while one is pending', () => {
    store.saveAccount(command());
    store.saveAccount(command());
    expect(api.updateFarmerProfile).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid input without mutating the original profile or sending a request', () => {
    store.saveAccount(
      new UpdateFarmerAccountCommand({
        firstName: 'Pedro',
        lastName: 'García',
        phoneNumber: '1234567890123456',
      }),
    );
    expect(api.updateFarmerProfile).not.toHaveBeenCalled();
    expect(original.phoneNumber).toBe('912345678');
    expect(store.contactSaved()).toBe(false);
    expect(store.error()).toBeTruthy();
  });

  it('persists names and contact together', () => {
    store.saveAccount(
      new UpdateFarmerAccountCommand({
        firstName: '  María José ',
        lastName: ' Quispe Rojas ',
        phoneNumber: '987654321',
      }),
    );
    const outgoing = api.updateFarmerProfile.mock.calls[0][0] as FarmerProfile;
    expect(outgoing.firstName).toBe('María José');
    expect(outgoing.lastName).toBe('Quispe Rojas');
    expect(store.profile()?.fullName).toBe('');
    response.next(outgoing);
    response.complete();
    expect(store.profile()?.fullName).toBe('María José Quispe Rojas');
    expect(store.profile()?.email).toBe('old@example.com');
    expect(store.contactSaved()).toBe(true);
  });

  it('does not persist whitespace-only names or change the existing profile', () => {
    store.saveAccount(
      new UpdateFarmerAccountCommand({
        firstName: ' ',
        lastName: 'Quispe',
        phoneNumber: '987654321',
      }),
    );
    expect(api.updateFarmerProfile).not.toHaveBeenCalled();
    expect(store.profile()).toBe(original);
    expect(store.profile()?.email).toBe('old@example.com');
    expect(store.contactSaved()).toBe(false);
  });

  it('loads a profile without a phone number or name fields', () => {
    const profile = new FarmerProfileAssembler().toEntityFromResource({
      id: 1,
      userId: 1,
      phoneNumber: null,
      email: 'old@example.com',
    });
    expect(profile.firstName).toBe('');
    expect(profile.lastName).toBe('');
    expect(profile.fullName).toBe('');
    expect(profile.phoneNumber).toBe('');
  });
});

it('uses the profile ID, sends editable fields only and exposes Spring validation errors', () => {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const http = TestBed.inject(HttpTestingController);
  const endpoint = new FarmerProfilesApiEndpoint(TestBed.inject(HttpClient));
  const url =
    environment.platformProviderApiBaseUrl + environment.platformProviderProfilesEndpointPath;
  const resource = {
    id: 12,
    userId: 5,
    firstName: 'Pedro',
    lastName: 'García',
    phoneNumber: null,
    email: 'profile@example.com',
  };

  const result = vi.fn();
  endpoint.getByUser(5).subscribe(result);
  const get = http.expectOne(url + '?userId=5');
  expect(get.request.method).toBe('GET');
  get.flush([resource]);
  const profile = result.mock.calls[0][0] as FarmerProfile;
  expect(profile.phoneNumber).toBe('');
  profile.updatePhoneNumber('987654321');

  const onError = vi.fn();
  endpoint.update(profile).subscribe({ error: onError });
  const put = http.expectOne(url + '/12');
  expect(put.request.method).toBe('PUT');
  expect(put.request.body).toEqual({
    firstName: 'Pedro',
    lastName: 'García',
    phoneNumber: '987654321',
  });
  put.flush(
    { details: 'Campo phoneNumber: valor inválido' },
    {
      status: 400,
      statusText: 'Bad Request',
    },
  );
  expect(onError).toHaveBeenCalledWith(new Error('Campo phoneNumber: valor inválido'));
  http.verify();
});
