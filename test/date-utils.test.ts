import { describe, it, expect } from 'vitest'
import { getOffsetDate, getPreviousDate, getNextDate } from '../src/handler'

describe('getOffsetDate', () => {
	it('returns same date with zero offset', () => {
		expect(getOffsetDate('06-15', 0)).toBe('06-15')
	})

	it('moves forward one day', () => {
		expect(getOffsetDate('06-15', 1)).toBe('06-16')
	})

	it('moves backward one day', () => {
		expect(getOffsetDate('06-15', -1)).toBe('06-14')
	})

	it('handles month boundary forward', () => {
		expect(getOffsetDate('01-31', 1)).toBe('02-01')
	})

	it('handles month boundary backward', () => {
		expect(getOffsetDate('02-01', -1)).toBe('01-31')
	})

	it('handles year wrap forward (Dec 31 -> Jan 1)', () => {
		expect(getOffsetDate('12-31', 1)).toBe('01-01')
	})

	it('handles year wrap backward (Jan 1 -> Dec 31)', () => {
		expect(getOffsetDate('01-01', -1)).toBe('12-31')
	})

	it('handles February end (non-leap year behavior)', () => {
		// Using 2023 (non-leap year) internally
		expect(getOffsetDate('02-28', 1)).toBe('03-01')
	})

	it('handles multi-day offset forward', () => {
		expect(getOffsetDate('06-28', 5)).toBe('07-03')
	})

	it('handles multi-day offset backward', () => {
		expect(getOffsetDate('07-03', -5)).toBe('06-28')
	})

	it('preserves leading zeros in month', () => {
		expect(getOffsetDate('01-15', 0)).toBe('01-15')
	})

	it('preserves leading zeros in day', () => {
		expect(getOffsetDate('06-05', 0)).toBe('06-05')
	})
})

describe('getPreviousDate', () => {
	it('returns previous day', () => {
		expect(getPreviousDate('06-15')).toBe('06-14')
	})

	it('handles year wrap', () => {
		expect(getPreviousDate('01-01')).toBe('12-31')
	})

	it('handles month boundary', () => {
		expect(getPreviousDate('03-01')).toBe('02-28')
	})
})

describe('getNextDate', () => {
	it('returns next day', () => {
		expect(getNextDate('06-15')).toBe('06-16')
	})

	it('handles year wrap', () => {
		expect(getNextDate('12-31')).toBe('01-01')
	})

	it('handles month boundary', () => {
		expect(getNextDate('01-31')).toBe('02-01')
	})
})
