import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsDialog } from '../components/settings-dialog';
import { UserSettings } from '../lib/types';

// Mock the useConvexSettings hook
jest.mock('../lib/hooks/use-convex-settings', () => ({
  useConvexSettings: () => ({
    settings: {
      per_page: 20,
      per_channel: 10,
      showThumbnails: true,
      showDescriptions: true,
      defaultFeedType: 'all' as const,
      sortOrder: 'newest' as const,
      caching_ttl: 0,
      concurrency: 6,
    },
    loading: false,
    error: null,
    updateSettings: jest.fn(),
    refreshSettings: jest.fn(),
  }),
}));

describe('SettingsDialog', () => {
  const mockOnSave = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockSettings: UserSettings = {
    per_page: 20,
    per_channel: 10,
    showThumbnails: true,
    showDescriptions: true,
    defaultFeedType: 'all',
    sortOrder: 'newest',
    caching_ttl: 0,
    concurrency: 6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders settings dialog when open', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Feed Settings')).toBeInTheDocument();
    expect(screen.getByText('Display Options')).toBeInTheDocument();
    expect(screen.getByText('Content Filtering')).toBeInTheDocument();
    expect(screen.getByText('Performance Settings')).toBeInTheDocument();
  });

  it('does not render dialog when closed', () => {
    render(
      <SettingsDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error="Failed to save settings"
      />
    );

    expect(screen.getByText('Failed to save settings')).toBeInTheDocument();
  });

  it('initializes form with current settings', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByDisplayValue('20')).toBeInTheDocument(); // per_page
    expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // per_channel
    expect(screen.getByDisplayValue('6')).toBeInTheDocument(); // concurrency
    expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // caching_ttl
  });

  it('validates per_page input', async () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const perPageInput = screen.getByLabelText('Videos per page');

    // Test invalid value (too high)
    fireEvent.change(perPageInput, { target: { value: '150' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Videos per page must be between 1 and 100')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates per_channel input', async () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const perChannelInput = screen.getByLabelText('Videos per channel');

    // Test invalid value (too high)
    fireEvent.change(perChannelInput, { target: { value: '100' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Videos per channel must be between 1 and 50')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates concurrency input', async () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const concurrencyInput = screen.getByLabelText('Concurrent requests');

    // Test invalid value (too high)
    fireEvent.change(concurrencyInput, { target: { value: '25' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Concurrency must be between 1 and 20')).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates caching_ttl input', async () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const cacheTtlInput = screen.getByLabelText('Cache duration (seconds)');

    // Test invalid value (negative)
    fireEvent.change(cacheTtlInput, { target: { value: '-1' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText('Cache duration must be between 0 and 86400 seconds')
      ).toBeInTheDocument();
    });

    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('allows valid settings to be saved', async () => {
    mockOnSave.mockResolvedValueOnce(undefined);

    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    // Update some settings
    const perPageInput = screen.getByLabelText('Videos per page');
    fireEvent.change(perPageInput, { target: { value: '30' } });

    const showThumbnailsCheckbox = screen.getByLabelText('Show video thumbnails');
    fireEvent.click(showThumbnailsCheckbox);

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        per_page: 30,
        showThumbnails: false,
      });
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('disables save button while loading', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={true}
        error={null}
      />
    );

    const saveButton = screen.getByText('Saving...');
    expect(saveButton).toBeDisabled();
  });

  it('disables save button when there are validation errors', async () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const perPageInput = screen.getByLabelText('Videos per page');
    fireEvent.change(perPageInput, { target: { value: '150' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });
  });

  it('closes dialog on cancel', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles display option toggles', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const showThumbnailsCheckbox = screen.getByLabelText('Show video thumbnails');
    const showDescriptionsCheckbox = screen.getByLabelText('Show video descriptions');

    // Both should be checked by default
    expect(showThumbnailsCheckbox).toBeChecked();
    expect(showDescriptionsCheckbox).toBeChecked();

    // Toggle thumbnails off
    fireEvent.click(showThumbnailsCheckbox);
    expect(showThumbnailsCheckbox).not.toBeChecked();

    // Toggle descriptions off
    fireEvent.click(showDescriptionsCheckbox);
    expect(showDescriptionsCheckbox).not.toBeChecked();
  });

  it('handles content filtering options', () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const feedTypeSelect = screen.getByLabelText('Default content type');
    const sortOrderSelect = screen.getByLabelText('Sort order');

    // Check default values
    expect(feedTypeSelect).toHaveValue('all');
    expect(sortOrderSelect).toHaveValue('newest');

    // Change feed type
    fireEvent.change(feedTypeSelect, { target: { value: 'video' } });
    expect(feedTypeSelect).toHaveValue('video');

    // Change sort order
    fireEvent.change(sortOrderSelect, { target: { value: 'oldest' } });
    expect(sortOrderSelect).toHaveValue('oldest');
  });

  it('clears validation errors when input is corrected', async () => {
    render(
      <SettingsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        settings={mockSettings}
        onSave={mockOnSave}
        loading={false}
        error={null}
      />
    );

    const perPageInput = screen.getByLabelText('Videos per page');

    // Set invalid value
    fireEvent.change(perPageInput, { target: { value: '150' } });

    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Videos per page must be between 1 and 100')).toBeInTheDocument();
    });

    // Correct the value
    fireEvent.change(perPageInput, { target: { value: '25' } });

    await waitFor(() => {
      expect(
        screen.queryByText('Videos per page must be between 1 and 100')
      ).not.toBeInTheDocument();
    });
  });
});
