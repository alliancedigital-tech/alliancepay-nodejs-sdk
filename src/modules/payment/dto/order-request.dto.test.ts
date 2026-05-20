import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { OrderRequestSchema } from './order-request.dto';

describe('OrderRequestSchema Validation', () => {
    const validRequest = {
        merchantRequestId: 'REQ-1',
        merchantId: "M-1",
        hppPayType: "PURCHASE",
        coinAmount: 100,
        paymentMethods: ["card"],
        successUrl: "https://ok.com",
        failUrl: "https://fail.com",
        statusPageType: "REDIRECT",
        customerData: {
            senderCustomerId: "CUST-001"
        }
    };

    it('should validate correct order creation request', () => {
        expect(() => DtoValidator.validate(validRequest, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if nested customerData.senderCustomerId is empty', () => {
        const invalid = { ...validRequest, customerData: {senderCustomerId: ""} };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too small: expected string to have >=1 characters for field customerData.senderCustomerId'
        );
    });

    it('should throw error if nested customerData.senderCustomerId is missing', () => {
        const invalid = { ...validRequest, customerData: {} };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid input: expected string, received undefined for field customerData.senderCustomerId'
        );
    });

    it('should accept optional fields like merchantComment', () => {
        const withComment = { ...validRequest, merchantComment: "Testing payment" };
        expect(() => DtoValidator.validate(withComment, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if merchantRequestId exceeds 36 characters', () => {
        const invalid = { ...validRequest, merchantRequestId: 'A'.repeat(37) };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=36 characters for field merchantRequestId'
        );
    });

    it('should accept merchantRequestId with exactly 36 characters', () => {
        const valid = { ...validRequest, merchantRequestId: '137d9304-0368-11ed-b939-0242ac120002' };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if merchantId exceeds 36 characters', () => {
        const invalid = { ...validRequest, merchantId: 'A'.repeat(37) };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=36 characters for field merchantId'
        );
    });

    it('should throw error if coinAmount is a float', () => {
        const invalid = { ...validRequest, coinAmount: 100.5 };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid input: expected int, received number for field coinAmount'
        );
    });

    it('should throw error if expirationTimeMinutes exceeds 9999', () => {
        const invalid = { ...validRequest, expirationTimeMinutes: 10000 };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected number to be <=9999 for field expirationTimeMinutes'
        );
    });

    it('should throw error if expirationTimeMinutes is a float', () => {
        const invalid = { ...validRequest, expirationTimeMinutes: 5.5 };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid input: expected int, received number for field expirationTimeMinutes'
        );
    });

    it('should accept expirationTimeMinutes = 9999', () => {
        const valid = { ...validRequest, expirationTimeMinutes: 9999 };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if successUrl exceeds 1000 characters', () => {
        const invalid = { ...validRequest, successUrl: 'https://ok.com/' + 'a'.repeat(986) };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=1000 characters for field successUrl'
        );
    });

    it('should throw error if failUrl exceeds 1000 characters', () => {
        const invalid = { ...validRequest, failUrl: 'https://fail.com/' + 'a'.repeat(984) };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=1000 characters for field failUrl'
        );
    });

    it('should throw error if notificationUrl exceeds 255 characters', () => {
        const invalid = { ...validRequest, notificationUrl: 'https://ok.com/' + 'a'.repeat(241) };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=255 characters for field notificationUrl'
        );
    });

    it('should accept notificationUrl as empty string', () => {
        const valid = { ...validRequest, notificationUrl: '' };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if merchantComment exceeds 255 characters', () => {
        const invalid = { ...validRequest, merchantComment: 'A'.repeat(256) };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=255 characters for field merchantComment'
        );
    });

    it('should throw error if hppPayType is A2A and merchantComment is missing', () => {
        const invalid = { ...validRequest, hppPayType: 'A2A' };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: merchantComment is required when hppPayType is A2A for field merchantComment'
        );
    });

    it('should accept hppPayType = A2A when merchantComment is provided', () => {
        const valid = { ...validRequest, hppPayType: 'A2A', merchantComment: 'Transfer comment' };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should accept hppPayType = PURCHASE without merchantComment', () => {
        const valid = { ...validRequest, hppPayType: 'PURCHASE' };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should accept hppPayType = "A2A" with merchantComment', () => {
        const valid = { ...validRequest, hppPayType: 'A2A', merchantComment: 'Transfer' };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should accept hppPayType = "PURCHASE"', () => {
        const valid = { ...validRequest, hppPayType: 'PURCHASE' };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if hppPayType is an unknown value', () => {
        const invalid = { ...validRequest, hppPayType: 'HPP' };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid option: expected one of "A2A"|"PURCHASE" for field hppPayType'
        );
    });

    it('should throw error if hppPayType is empty string', () => {
        const invalid = { ...validRequest, hppPayType: '' };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid option: expected one of "A2A"|"PURCHASE" for field hppPayType'
        );
    });
});

describe('CustomerDataSchema Validation', () => {
    const validRequest = {
        merchantRequestId: 'REQ-1',
        merchantId: 'M-1',
        hppPayType: 'PURCHASE',
        coinAmount: 100,
        paymentMethods: ['card'],
        successUrl: 'https://ok.com',
        failUrl: 'https://fail.com',
        statusPageType: 'REDIRECT',
        customerData: {
            senderCustomerId: 'CUST-001',
        },
    };

    it('should throw error if senderCustomerId exceeds 255 characters', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'A'.repeat(256) } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too big: expected string to have <=255 characters for field customerData.senderCustomerId'
        );
    });

    it('should throw error if senderEmail has invalid format', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderEmail: 'not-an-email' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid email address for field customerData.senderEmail'
        );
    });

    it('should accept valid senderEmail', () => {
        const valid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderEmail: 'mail@gmail.com' } };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should accept senderCountry = "804" (Ukraine numeric code)', () => {
        const valid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderCountry: '804' } };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should accept senderCountry with 1 digit', () => {
        const valid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderCountry: '1' } };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if senderCountry is alpha-2 code "UA"', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderCountry: 'UA' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid string: must match pattern /^\\d{1,3}$/ for field customerData.senderCountry'
        );
    });

    it('should throw error if senderCountry is alpha-3 code "UKR"', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderCountry: 'UKR' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid string: must match pattern /^\\d{1,3}$/ for field customerData.senderCountry'
        );
    });

    it('should throw error if senderCountry has 4 digits', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderCountry: '1234' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid string: must match pattern /^\\d{1,3}$/ for field customerData.senderCountry'
        );
    });

    it('should throw error if senderCountry contains letters mixed with digits', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderCountry: '80A' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid string: must match pattern /^\\d{1,3}$/ for field customerData.senderCountry'
        );
    });

    it('should throw error if customerData contains unknown fields', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', unknownField: 'value' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Unrecognized key: "unknownField" for field customerData'
        );
    });

    it('should accept valid IPv4 address', () => {
        const valid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderIp: '123.12.12.12' } };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should accept valid IPv6 address', () => {
        const valid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderIp: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' } };
        expect(() => DtoValidator.validate(valid, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if senderIp has invalid IPv4 format "192.168.1.11212"', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderIp: '192.168.1.11212' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid IP address for field customerData.senderIp'
        );
    });

    it('should throw error if senderIp is a plain string', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderIp: 'not-an-ip' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid IP address for field customerData.senderIp'
        );
    });

    it('should throw error if senderIp has invalid IPv6 format', () => {
        const invalid = { ...validRequest, customerData: { senderCustomerId: 'CUST-001', senderIp: '2001:0db8:85a3:ZZZZ' } };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid IP address for field customerData.senderIp'
        );
    });
});
