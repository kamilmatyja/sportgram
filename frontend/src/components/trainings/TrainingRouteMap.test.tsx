import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TrainingRouteMap } from './TrainingRouteMap';

describe('TrainingRouteMap', () => {
    it('renders the standard route-map surface by default', () => {
        const markup = renderToStaticMarkup(<TrainingRouteMap points={[]} />);

        expect(markup).toContain('class="route-map-container"');
    });

    it('renders the flat route-map surface when embedded in a table', () => {
        const markup = renderToStaticMarkup(<TrainingRouteMap points={[]} flat />);

        expect(markup).toContain('class="route-map-container-flat"');
    });

    it('uses a supplied class for the route-map surface', () => {
        const markup = renderToStaticMarkup(<TrainingRouteMap points={[]} className="training-route-preview" />);

        expect(markup).toContain('class="training-route-preview"');
    });
});
