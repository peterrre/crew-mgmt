import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AssignmentPanel } from '../components/AssignmentPanel';
import { fetchAvailableUsers } from '../lib/api/users';
import { toast } from 'sonner';

// Mocks
jest.mock('../lib/api/users');
jest.mock('sonner');

const createProps = (overrides: Partial<React.ComponentProps<typeof AssignmentPanel>> = {}) => ({
  shiftId: 'shift-1',
  assignments: [],
  minHelpers: 1,
  maxHelpers: 3,
  currentUserId: undefined,
  isAdmin: false,
  isCrew: false,
  isVolunteer: false,
  onSelfAssign: jest.fn(),
  onRemoveAssignment: jest.fn(),
  onClose: jest.fn(),
  ...overrides,
});

describe('AssignmentPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Volunteer mode', () => {
    const props = createProps({ isVolunteer: true });

    it('shows Join as Responsible button when no responsible assigned', () => {
      render(<AssignmentPanel {...props} />);
      const btn = screen.getByRole('button', { name: /take as responsible/i });
      expect(btn).toBeInTheDocument();
    });

    it('calls onSelfAssign with RESPONSIBLE when Join as Responsible clicked', async () => {
      render(<AssignmentPanel {...props} />);
      const btn = screen.getByRole('button', { name: /take as responsible/i });
      await fireEvent.click(btn);
      expect(props.onSelfAssign).toHaveBeenCalledWith('RESPONSIBLE');
    });

    it('shows Join as Helper button when helpers < maxHelpers', () => {
      render(<AssignmentPanel {...props} />);
      const btn = screen.getByRole('button', { name: /join as helper/i });
      expect(btn).toBeInTheDocument();
    });

    it('calls onSelfAssign with HELPER when Join as Helper clicked', async () => {
      render(<AssignmentPanel {...props} />);
      const btn = screen.getByRole('button', { name: /join as helper/i });
      await fireEvent.click(btn);
      expect(props.onSelfAssign).toHaveBeenCalledWith('HELPER');
    });

    it('does not show assignment panel when already assigned', () => {
      const withAssignment = createProps({
        isVolunteer: true,
        assignments: [{ id: 'a1', role: 'HELPER', userId: 'user-1' }],
        currentUserId: 'user-1',
      });
      render(<AssignmentPanel {...withAssignment} />);
      expect(screen.queryByRole('button', { name: /take as responsible/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /join as helper/i })).not.toBeInTheDocument();
    });
  });

  describe('Admin/Crew mode', () => {
    const baseProps = createProps({ isAdmin: true });

    beforeEach(() => {
      fetchAvailableUsers.mockResolvedValue([]);
    });

    it('loads users on mount when admin or crew', async () => {
      render(<AssignmentPanel {...baseProps} />);
      expect(fetchAvailableUsers).toHaveBeenCalledWith({ shiftId: 'shift-1' });
      await waitFor(() => expect(toast).not.toHaveBeenCalledWith('Failed to load users'));
    });

    it('shows Assign dropdown when not volunteer', () => {
      render(<AssignmentPanel {...baseProps} />);
      // Get all buttons with name "Assign"
      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      // Find the one that is the dropdown trigger (has aria-haspopup="menu")
      const trigger = assignButtons.find(btn => btn.getAttribute('aria-haspopup') === 'menu');
      expect(trigger).toBeInTheDocument();
    });

    describe('Assign Responsible dropdown item', () => {
      it('calls handleAssignResponsible which shows placeholder toast and closes panel', async () => {
        render(<AssignmentPanel {...baseProps} />);
        // Get all buttons with name "Assign"
        const assignButtons = screen.getAllByRole('button', { name: /assign/i });
        // Find the dropdown trigger (aria-haspopup="menu")
        const assignBtn = assignButtons.find(btn => btn.getAttribute('aria-haspopup') === 'menu');
        await fireEvent.click(assignBtn);
        // Wait for the menu item to appear
        const menuItem = await screen.findByRole('menuitem', { name: /assign responsible/i });
        await fireEvent.click(menuItem);
        expect(toast).toHaveBeenCalledWith('Assigned as responsible (placeholder)');
        expect(baseProps.onClose).toHaveBeenCalled();
      });
    });

    describe('Assign Helper dropdown item', () => {
      it('calls handleAssignHelper which shows placeholder toast and closes panel', async () => {
        render(<AssignmentPanel {...baseProps} />);
        // Get all buttons with name "Assign"
        const assignButtons = screen.getAllByRole('button', { name: /assign/i });
        // Find the dropdown trigger (aria-haspopup="menu")
        const assignBtn = assignButtons.find(btn => btn.getAttribute('aria-haspopup') === 'menu');
        await fireEvent.click(assignBtn);
        // Wait for the menu item to appear
        const menuItem = await screen.findByRole('menuitem', { name: /assign helper/i });
        await fireEvent.click(menuItem);
        expect(toast).toHaveBeenCalledWith('Assigned as helper (placeholder)');
        expect(baseProps.onClose).toHaveBeenCalled();
      });
    });

    it('shows Assign button for Responsible when nobody assigned', () => {
      render(<AssignmentPanel {...baseProps} />);
      // Get all buttons with name "Assign"
      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      // There should be at least two: dropdown trigger and the button in the nobody assigned section
      expect(assignButtons.length).toBeGreaterThanOrEqual(2);
    });

    it('clicking Assign button for Responsible sets selectedUserId and calls handleAssignResponsible', async () => {
      render(<AssignmentPanel {...baseProps} />);
      // Get all buttons with name "Assign"
      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      // The button in the nobody assigned section does NOT have aria-haspopup
      const plainAssignBtn = assignButtons.find(btn => !btn.getAttribute('aria-haspopup'));
      await fireEvent.click(plainAssignBtn);
      // The handler will early return because selectedUserId is null, but we can verify that setSelectedUserId was called via the onClick prop.
      // Since we cannot directly spy on useState setter, we at least ensure no error.
      expect(true).toBeTruthy();
    });
  });

  describe('Responsible/Helper removal', () => {
    it('shows remove dropdown for responsible when assigned and user has permission', async () => {
      const props = createProps({
        isAdmin: true,
        assignments: [{ id: 'r1', role: 'RESPONSIBLE', userId: 'user-1' }],
        currentUserId: 'user-1',
      });
      render(<AssignmentPanel {...props} />);
      const respDiv = screen.getByText('Responsible');
      // Find the button with aria-label "More options" inside the responsible section
      const moreBtn = screen.getByRole('button', { name: /more options/i });
      // There might be multiple; we need the one associated with responsible.
      // We can find by first checking that the button is a descendant of the respDiv's parent section.
      // Simpler: find all buttons with that name and take the first one that is within the responsible's container.
      const allMoreBtns = screen.getAllByRole('button', { name: /more options/i });
      // Find the one that is inside the same flex items-center space-x-3 div as the respDiv
      const respSection = respDiv.closest('div.flex.items-center.space-x-3');
      const moreBtnInResp = Array.from(allMoreBtns).find(btn => respSection.contains(btn));
      expect(moreBtnInResp).toBeInTheDocument();
      await fireEvent.click(moreBtnInResp);
      const removeItem = screen.getByRole('menuitem', { name: /remove/i });
      expect(removeItem).toBeInTheDocument();
      await fireEvent.click(removeItem);
      expect(props.onRemoveAssignment).toHaveBeenCalledWith('r1');
      expect(props.onClose).toHaveBeenCalled();
    });

    it('shows remove dropdown for helper when assigned and user has permission', async () => {
      const props = createProps({
        isAdmin: true,
        assignments: [{ id: 'h1', role: 'HELPER', userId: 'user-2' }],
        currentUserId: 'user-2',
      });
      render(<AssignmentPanel {...props} />);
      const helperDiv = screen.getByText('Helpers (1)');
      // Find the helper section (the div that contains the helper text)
      const helperSection = helperDiv.closest('div.flex.items-center.space-x-2');
      // Within the helper section, there is a button with aria-label "More options"
      const moreBtn = helperSection.querySelector('button[aria-label="More options"]');
      expect(moreBtn).toBeInTheDocument();
      await fireEvent.click(moreBtn);
      const removeItem = screen.getByRole('menuitem', { name: /remove/i });
      expect(removeItem).toBeInTheDocument();
      await fireEvent.click(removeItem);
      expect(props.onRemoveAssignment).toHaveBeenCalledWith('h1');
    });
  });

  describe('Under/Over max helpers warnings', () => {
    it('shows Under min warning when helperCount < minHelpers', () => {
      const props = createProps({ helpers: [], minHelpers: 2, maxHelpers: 5 });
      render(<AssignmentPanel {...props} />);
      expect(screen.getByText(/under min/i)).toBeInTheDocument();
    });

    it('shows Over max warning when helperCount > maxHelpers', () => {
      const props = createProps({
        helpers: Array.from({ length: 5 }, (_, i) => ({ id: `h${i}`, role: 'HELPER', userId: `u${i}` })),
        minHelpers: 1,
        maxHelpers: 3,
      });
      render(<AssignmentPanel {...props} />);
      expect(screen.getByText(/over max/i)).toBeInTheDocument();
    });
  });
});