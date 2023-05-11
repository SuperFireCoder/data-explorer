import { render } from '@testing-library/react';
import Header from './../../components/Header';

// Mock the SignInOutButton component
jest.mock('./SignInOutButton', () => () => <div data-testid="sign-in-out-button" />);

// Mock the useTheme hook
jest.mock('@ecocommons-australia/ui-library', () => ({
  useTheme: () => ({
    getThemeValue: jest.fn().mockReturnValue({}),
  }),
  Header: () => <div data-testid="header" />,
  Constants: {
    Urls: {},
  },
}));

describe('Header component', () => {
  it('renders the header with SignInOutButton', () => {
    const { getByTestId } = render(<Header />);
    expect(getByTestId('header')).toBeInTheDocument();
    expect(getByTestId('sign-in-out-button')).toBeInTheDocument();
  });
});
