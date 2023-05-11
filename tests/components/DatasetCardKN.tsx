import { render, fireEvent } from '@testing-library/react';
import { Props } from './../../components/DatasetCardKN';
import DatasetCardKN from './../../components/DatasetCardKN';

describe('DatasetCardKN', () => {
  const props: Props = {
    datasetId: '123',
    title: 'Test Dataset',
    description: 'This is a test dataset',
    distributions: []
  };

  it('renders dataset card with title and description', () => {
    const { getByText } = render(<DatasetCardKN {...props} />);
    expect(getByText('Test Dataset')).toBeInTheDocument();
    expect(getByText('This is a test dataset')).toBeInTheDocument();
  });

  it('opens metadata drawer on info button click', () => {
    const { getByTestId } = render(<DatasetCardKN {...props} />);
    fireEvent.click(getByTestId('info-button'));
    expect(getByTestId('metadata-drawer')).toBeVisible();
  });

  it('opens get data drawer on get data button click', () => {
    const { getByText, getByTestId } = render(<DatasetCardKN {...props} distributions={[{ downloadURL: 'http://example.com/data' }]} />);
    fireEvent.click(getByText('Get Data'));
    expect(getByTestId('get-data-drawer')).toBeVisible();
  });

  it('disables view button if landing page url is undefined', () => {
    const { getByTestId } = render(<DatasetCardKN {...props} />);
    expect(getByTestId('view-button')).toBeDisabled();
  });

  it('renders type indicator if type prop is provided', () => {
    const { getByTestId } = render(<DatasetCardKN {...props} type="csv" />);
    expect(getByTestId('type')).toBeInTheDocument();
  });

  it('renders last updated date if lastUpdated prop is provided', () => {
    const { getByTestId } = render(<DatasetCardKN {...props} lastUpdated={new Date()} />);
    expect(getByTestId('last-updated-date')).toBeInTheDocument();
  });
});
