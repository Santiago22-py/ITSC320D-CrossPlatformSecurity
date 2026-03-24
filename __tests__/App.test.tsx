/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({children}: {children: React.ReactNode}) => children,
}));

jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({children}: {children: React.ReactNode}) => children,
    Screen: ({
      children,
      component: Component,
    }: {
      children?: ((props: any) => React.ReactNode) | React.ReactNode;
      component?: React.ComponentType<any>;
    }) => {
      const screenProps = {
        navigation: {navigate: jest.fn(), goBack: jest.fn()},
        route: {key: 'test-key', name: 'MockScreen', params: undefined},
      };

      if (typeof children === 'function') {
        return children(screenProps);
      }

      if (Component) {
        return <Component {...screenProps} />;
      }

      return children ?? null;
    },
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
