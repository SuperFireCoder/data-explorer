import { render, fireEvent } from '@testing-library/react';
import Pagination from './../../components/Pagination';

describe('Pagination', () => {
  const props = {
    currentIndex: 0,
    max: 10,
    onSelect: jest.fn(),
  };

  test('renders all page buttons when max <= 9', () => {
    const { getAllByTestId } = render(<Pagination {...props} />);
    const pageButtons = getAllByTestId('pagination-button');
    expect(pageButtons).toHaveLength(10);
  });

  test('renders clipped page buttons when max > 9', () => {
    const { getAllByTestId, getByText } = render(<Pagination {...props} max={20} />);
    const pageButtons = getAllByTestId('pagination-button');
    expect(pageButtons).toHaveLength(9);

    // Check for ellipsis button
    const ellipsisButton = getByText('...');
    expect(ellipsisButton).toBeInTheDocument();

    // Check that first and last buttons are rendered
    const firstButton = getByText('1');
    const lastButton = getByText('20');
    expect(firstButton).toBeInTheDocument();
    expect(lastButton).toBeInTheDocument();
  });

  test('calls onSelect handler when a page button is clicked', () => {
    const { getAllByTestId } = render(<Pagination {...props} />);
    const pageButtons = getAllByTestId('pagination-button');
    fireEvent.click(pageButtons[1]);
    expect(props.onSelect).toHaveBeenCalledWith(1);
  });

  test('disables ellipsis button when local bounds are within limits', () => {
    const { getByText } = render(<Pagination {...props} currentIndex={4} max={10} />);
    const ellipsisButton = getByText('...');
    expect(ellipsisButton).toBeDisabled();
  });

  test('enables ellipsis button when local bounds are outside limits', () => {
    const { getByText } = render(<Pagination {...props} currentIndex={4} max={20} />);
    const ellipsisButton = getByText('...');
    expect(ellipsisButton).toBeEnabled();
  });
});
