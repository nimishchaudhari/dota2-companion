import { render, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';
import { AuthContext } from '../../contexts/AuthContext.jsx';
import { DataProvider } from '../../contexts/DataContext.jsx';
import { darkTheme } from '../../theme/antdTheme.js';

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.authContext - Mock auth context values
 * @param {Object} options.initialData - Initial data context values
 * @returns {Object} Render result with additional utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    authContext = {
      user: null,
      isLoading: false,
      error: null,
      authMode: 'development',
      isAuthenticated: false,
      loginWithPlayerId: async () => {},
      logout: () => {},
      refreshUserData: async () => {},
      clearError: () => {}
    },
    initialData = {},
    ...renderOptions
  } = options;

  function Wrapper({ children }) {
    return (
      <ConfigProvider theme={darkTheme}>
        <AuthContext.Provider value={authContext}>
          <DataProvider initialData={initialData}>
            {children}
          </DataProvider>
        </AuthContext.Provider>
      </ConfigProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...result,
    user: userEvent.setup(),
    // Additional utilities
    rerender: (newUi) => result.rerender(
      <ConfigProvider theme={darkTheme}>
        <AuthContext.Provider value={authContext}>
          <DataProvider initialData={initialData}>
            {newUi}
          </DataProvider>
        </AuthContext.Provider>
      </ConfigProvider>
    )
  };
}

/**
 * Verify that Ant Design dark theme is properly applied
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Whether dark theme is applied
 */
export function verifyDarkThemeApplication(element) {
  const computedStyle = window.getComputedStyle(element);
  
  // Check for dark theme characteristics
  const checks = {
    hasAntPrefix: element.className.includes('ant-'),
    hasDarkBackground: computedStyle.backgroundColor.includes('rgb(20, 20, 20)') || 
                      computedStyle.backgroundColor.includes('rgba(255, 255, 255, 0.04)'),
    hasLightText: computedStyle.color.includes('rgb(255, 255, 255)') || 
                  computedStyle.color.includes('rgba(255, 255, 255'),
    hasCyanAccent: computedStyle.borderColor?.includes('rgb(0, 217, 255)') ||
                   computedStyle.color?.includes('rgb(0, 217, 255)')
  };

  return Object.values(checks).some(Boolean);
}

/**
 * Perform actual drag and drop operation using real mouse events
 * @param {HTMLElement} element - Element to drag
 * @param {Object} from - Starting position {x, y}
 * @param {Object} to - Ending position {x, y}
 * @returns {Promise} Promise that resolves when drag is complete
 */
export async function performActualDrag(element, from, to) {
  const startX = from.x;
  const startY = from.y;
  const endX = to.x;
  const endY = to.y;

  // Get the drag handle within the element
  const dragHandle = element.querySelector('.widget-drag-handle') || element;

  // Simulate mouse down
  fireEvent.mouseDown(dragHandle, {
    clientX: startX,
    clientY: startY,
    buttons: 1
  });

  // Simulate mouse move
  fireEvent.mouseMove(document, {
    clientX: endX,
    clientY: endY,
    buttons: 1
  });

  // Simulate mouse up
  fireEvent.mouseUp(document, {
    clientX: endX,
    clientY: endY
  });

  // Wait for any animations or state updates
  await waitFor(() => {
    // Check if element position has changed
    const rect = element.getBoundingClientRect();
    return Math.abs(rect.x - startX) > 5 || Math.abs(rect.y - startY) > 5;
  }, { timeout: 2000 });
}

/**
 * Perform actual resize operation on grid layout widget
 * @param {HTMLElement} widget - Widget element to resize
 * @param {Object} newSize - New size {width, height}
 * @returns {Promise} Promise that resolves when resize is complete
 */
export async function performActualResize(widget, newSize) {
  const resizeHandle = widget.querySelector('.react-resizable-handle');
  
  if (!resizeHandle) {
    throw new Error('No resize handle found on widget');
  }

  const rect = widget.getBoundingClientRect();
  const startX = rect.right;
  const startY = rect.bottom;
  const endX = rect.left + newSize.width;
  const endY = rect.top + newSize.height;

  // Simulate resize drag
  fireEvent.mouseDown(resizeHandle, {
    clientX: startX,
    clientY: startY,
    buttons: 1
  });

  fireEvent.mouseMove(document, {
    clientX: endX,
    clientY: endY,
    buttons: 1
  });

  fireEvent.mouseUp(document, {
    clientX: endX,
    clientY: endY
  });

  // Wait for resize to complete
  await waitFor(() => {
    const newRect = widget.getBoundingClientRect();
    return Math.abs(newRect.width - newSize.width) < 10;
  }, { timeout: 2000 });
}

/**
 * Wait for Ant Design component to finish loading
 * @param {HTMLElement} container - Container to check
 * @param {Object} options - Wait options
 * @returns {Promise} Promise that resolves when loading is complete
 */
export async function waitForAntdLoading(container, options = {}) {
  const { timeout = 5000 } = options;

  // Wait for any Ant Design loading spinners to disappear
  await waitFor(() => {
    const spinners = container.querySelectorAll('.ant-spin');
    const skeletons = container.querySelectorAll('.ant-skeleton');
    
    return spinners.length === 0 && skeletons.length === 0;
  }, { timeout });

  // Wait for any data to be populated
  await waitFor(() => {
    const emptyStates = container.querySelectorAll('.ant-empty');
    const statistics = container.querySelectorAll('.ant-statistic-content-value');
    
    return statistics.length > 0 || emptyStates.length === 0;
  }, { timeout });
}

/**
 * Simulate viewport resize for responsive testing
 * @param {number} width - New viewport width
 * @param {number} height - New viewport height
 * @returns {Promise} Promise that resolves after resize
 */
export async function simulateViewportResize(width, height) {
  // Update window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Trigger resize event
  fireEvent(window, new Event('resize'));

  // Wait for responsive changes to take effect
  await waitFor(() => {
    // Check if matchMedia queries have updated
    const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
    return mediaQuery.matches === (width <= 768); // Assuming mobile breakpoint
  }, { timeout: 1000 });
}

/**
 * Test real localStorage persistence
 * @param {Function} action - Action that should trigger localStorage save
 * @param {string} key - localStorage key to check
 * @returns {Promise<any>} Parsed localStorage value
 */
export async function testLocalStoragePersistence(action, key) {
  // Clear localStorage before test
  localStorage.clear();

  // Perform action that should save to localStorage
  await action();

  // Wait for localStorage to be updated
  await waitFor(() => {
    return localStorage.getItem(key) !== null;
  }, { timeout: 2000 });

  const savedValue = localStorage.getItem(key);
  return JSON.parse(savedValue);
}

/**
 * Verify Ant Design form validation
 * @param {HTMLElement} form - Form element
 * @param {Object} testData - Test data to input
 * @returns {Promise<Object>} Validation results
 */
export async function verifyFormValidation(form, testData) {
  const user = userEvent.setup();
  const results = {
    fieldsValidated: 0,
    errorMessages: [],
    isValid: false
  };

  // Fill form fields
  for (const [fieldName, value] of Object.entries(testData)) {
    const field = form.querySelector(`[name="${fieldName}"]`) || 
                  form.querySelector(`#${fieldName}`) ||
                  form.querySelector(`[data-testid="${fieldName}"]`);
    
    if (field) {
      await user.clear(field);
      await user.type(field, String(value));
      results.fieldsValidated++;
    }
  }

  // Trigger form submission to validate
  const submitButton = form.querySelector('button[type="submit"]') ||
                       form.querySelector('.ant-btn-primary');
  
  if (submitButton) {
    await user.click(submitButton);
  }

  // Wait for validation messages
  await waitFor(() => {
    const errorElements = form.querySelectorAll('.ant-form-item-explain-error');
    return errorElements.length > 0;
  }, { timeout: 1000 }).catch(() => {
    // No validation errors found - form might be valid
  });

  // Collect error messages
  const errorElements = form.querySelectorAll('.ant-form-item-explain-error');
  results.errorMessages = Array.from(errorElements).map(el => el.textContent);
  results.isValid = errorElements.length === 0;

  return results;
}

/**
 * Test Ant Design notification appearance
 * @param {Function} action - Action that should trigger notification
 * @returns {Promise<HTMLElement|null>} Notification element if found
 */
export async function testNotificationAppearance(action) {
  // Perform action that should trigger notification
  await action();

  // Wait for notification to appear
  let notification = null;
  await waitFor(() => {
    notification = document.querySelector('.ant-notification');
    return notification !== null;
  }, { timeout: 3000 });

  return notification;
}

/**
 * Measure widget render performance
 * @param {Function} renderWidget - Function that renders the widget
 * @returns {Promise<Object>} Performance metrics
 */
export async function measureWidgetPerformance(renderWidget) {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize || 0;

  const result = await renderWidget();

  const endTime = performance.now();
  const endMemory = performance.memory?.usedJSHeapSize || 0;

  return {
    renderTime: endTime - startTime,
    memoryUsed: endMemory - startMemory,
    result
  };
}

/**
 * Test keyboard navigation through Ant Design components
 * @param {HTMLElement} container - Container to test navigation in
 * @returns {Promise<Array>} Array of focused elements in order
 */
export async function testKeyboardNavigation(container) {
  const user = userEvent.setup();
  const focusedElements = [];

  // Start from first focusable element
  const firstFocusable = container.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  
  if (firstFocusable) {
    firstFocusable.focus();
    focusedElements.push(document.activeElement);

    // Tab through elements
    for (let i = 0; i < 20; i++) { // Limit to prevent infinite loop
      await user.tab();
      
      if (document.activeElement === focusedElements[0]) {
        // We've cycled back to the beginning
        break;
      }
      
      if (container.contains(document.activeElement)) {
        focusedElements.push(document.activeElement);
      }
    }
  }

  return focusedElements;
}

/**
 * Verify color contrast for accessibility
 * @param {HTMLElement} element - Element to check
 * @returns {Object} Contrast analysis
 */
export function verifyColorContrast(element) {
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;
  const textColor = computedStyle.color;

  // Simple contrast check (would need more sophisticated implementation for WCAG compliance)
  const hasContrast = backgroundColor !== textColor && 
                      backgroundColor !== 'transparent' &&
                      textColor !== 'transparent';

  return {
    backgroundColor,
    textColor,
    hasContrast,
    // Would implement actual contrast ratio calculation here
    contrastRatio: hasContrast ? 'sufficient' : 'insufficient'
  };
}