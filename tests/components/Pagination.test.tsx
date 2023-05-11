import { render, fireEvent } from '@testing-library/react';
import Pagination from './../../components/Pagination';

describe('Pagination', () => {
  const props = {
    currentIndex: 0,
    max: 10,
    onSelect: jest.fn(),
  };

  test('calls onSelect handler when a page button is clicked', () => {
    const { getAllByTestId } = render(<Pagination {...props} />);
    const pageButtons = getAllByTestId('pagination-button');
    fireEvent.click(pageButtons[1]);
    expect(props.onSelect).toHaveBeenCalledWith(1);
  });
});
