import { describe, it, expect } from 'vitest'
import { generateHTML } from '../src/handler'

describe('generateHTML', () => {
	const defaultParams = {
		firstPassage: '<div class="passage">Genesis 1 content</div>',
		secondPassage: '<div class="passage">Matthew 1 content</div>',
		date: '01-15',
		previousDate: '01-14',
		nextDate: '01-16',
	}

	it('returns valid HTML document', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('<!DOCTYPE html>')
		expect(html).toContain("<html lang='en'>")
		expect(html).toContain('</html>')
	})

	it('includes proper meta tags', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain("<meta charset='UTF-8'>")
		expect(html).toContain('viewport')
		expect(html).toContain(
			'Daily Bible readings from The Axis Church in Nashville, TN',
		)
	})

	it('includes date in title', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('<title>Readings for')
		expect(html).toContain('January 15')
	})

	it('includes both passages', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('Genesis 1 content')
		expect(html).toContain('Matthew 1 content')
	})

	it('includes navigation links with correct dates', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('href="?date=01-14"')
		expect(html).toContain('href="?date=01-16"')
		expect(html).toContain('Previous day')
		expect(html).toContain('Next day')
	})

	it('includes navigation arrows', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('class="nav-arrow"')
		expect(html).toContain('←')
		expect(html).toContain('→')
	})

	it('includes the prayer text', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('Lord, open my eyes')
		expect(html).toContain('<strong>see</strong>')
		expect(html).toContain('<strong>hear</strong>')
		expect(html).toContain('<strong>know</strong>')
		expect(html).toContain('<strong>experience</strong>')
		expect(html).toContain('Amen')
	})

	it('includes ESV copyright notice', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('ESV® Bible')
		expect(html).toContain('Crossway')
		expect(html).toContain('500 verses')
	})

	it('includes responsive styling', () => {
		const html = generateHTML(defaultParams)

		expect(html).toContain('max-width: 750px')
		expect(html).toContain('font-family:')
	})

	it('formats date correctly for different months', () => {
		const julyHtml = generateHTML({
			...defaultParams,
			date: '07-04',
		})

		expect(julyHtml).toContain('July 4')

		const decHtml = generateHTML({
			...defaultParams,
			date: '12-25',
		})

		expect(decHtml).toContain('December 25')
	})

	it('handles edge case dates', () => {
		const newYearHtml = generateHTML({
			...defaultParams,
			date: '01-01',
			previousDate: '12-31',
			nextDate: '01-02',
		})

		expect(newYearHtml).toContain('January 1')
		expect(newYearHtml).toContain('href="?date=12-31"')
		expect(newYearHtml).toContain('href="?date=01-02"')
	})
})
