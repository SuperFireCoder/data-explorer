import { render, fireEvent } from '@testing-library/react';
import { Props } from '../../components/DatasetCardKN';
import DatasetCardKN from '../../components/DatasetCardKN';

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
  it('renders type indicator if type prop is provided', () => {
    const { getByTestId } = render(<DatasetCardKN {...props} type="csv" />);
    expect(getByTestId('type')).toBeInTheDocument();
  });

  it('renders last updated date if lastUpdated prop is provided', () => {
    const { getByTestId } = render(<DatasetCardKN {...props} lastUpdated={new Date()} />);
    expect(getByTestId('last-updated-date')).toBeInTheDocument();
  });
});
