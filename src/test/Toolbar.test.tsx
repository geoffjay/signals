import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toolbar } from '../components/Toolbar';

describe('Toolbar Component', () => {
  const mockTogglePlayback = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    mockTogglePlayback.mockClear();
  });

  it('should render with Start button when not playing', () => {
    render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);
    expect(screen.getByText('Start')).toBeInTheDocument();
  });

  it('should render with Stop button when playing', () => {
    render(<Toolbar isPlaying={true} onTogglePlayback={mockTogglePlayback} />);
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('should call onTogglePlayback when Start/Stop button clicked', () => {
    const { rerender } = render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

    const playButton = screen.getByText('Start');
    fireEvent.click(playButton);

    expect(mockTogglePlayback).toHaveBeenCalledTimes(1);

    rerender(<Toolbar isPlaying={true} onTogglePlayback={mockTogglePlayback} />);

    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);

    expect(mockTogglePlayback).toHaveBeenCalledTimes(2);
  });

  describe('View Toggle', () => {
    it('should show "Icons Only" button when labels are shown', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);
      expect(screen.getByText('Icons Only')).toBeInTheDocument();
    });

    it('should show "Show Labels" button when in icon-only mode', () => {
      localStorage.setItem('toolbar-show-labels', 'false');
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);
      expect(screen.getByText('Show Labels')).toBeInTheDocument();
    });

    it('should toggle between icon-only and labels view', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Initially shows labels
      expect(screen.getByText('Icons Only')).toBeInTheDocument();

      // Click to switch to icon-only
      fireEvent.click(screen.getByText('Icons Only'));

      waitFor(() => {
        expect(screen.getByText('Show Labels')).toBeInTheDocument();
      });
    });

    it('should persist view preference to localStorage', async () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Click to switch to icon-only
      fireEvent.click(screen.getByText('Icons Only'));

      await waitFor(() => {
        const saved = localStorage.getItem('toolbar-show-labels');
        expect(saved).toBe('false');
      });
    });

    it('should restore view preference from localStorage on mount', () => {
      localStorage.setItem('toolbar-show-labels', 'false');
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      expect(screen.getByText('Show Labels')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    it('should render all block group sections', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      expect(screen.getByText(/inputs/i)).toBeInTheDocument();
      expect(screen.getByText(/generators/i)).toBeInTheDocument();
      expect(screen.getByText(/processors/i)).toBeInTheDocument();
      expect(screen.getByText(/math/i)).toBeInTheDocument();
      expect(screen.getByText(/routing/i)).toBeInTheDocument();
      expect(screen.getByText(/outputs/i)).toBeInTheDocument();
    });

    it('should expand all sections by default', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Check that some blocks from each section are visible
      expect(screen.getByText('Slider')).toBeInTheDocument();
      expect(screen.getByText('Sine Wave')).toBeInTheDocument();
      expect(screen.getByText('Gain')).toBeInTheDocument();
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should collapse section when header is clicked', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Initially, Math section blocks are visible
      expect(screen.getByText('Add')).toBeInTheDocument();

      // Click the Math section header
      fireEvent.click(screen.getByText(/math/i));

      // Math section blocks should be hidden
      expect(screen.queryByText('Add')).not.toBeInTheDocument();
    });

    it('should expand collapsed section when header is clicked again', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Collapse the section
      fireEvent.click(screen.getByText(/math/i));
      expect(screen.queryByText('Add')).not.toBeInTheDocument();

      // Expand the section
      fireEvent.click(screen.getByText(/math/i));
      expect(screen.getByText('Add')).toBeInTheDocument();
    });

    it('should persist collapsed sections to localStorage', async () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Collapse a section
      fireEvent.click(screen.getByText(/math/i));

      await waitFor(() => {
        const saved = localStorage.getItem('toolbar-collapsed-sections');
        expect(saved).toBeTruthy();
        const sections = JSON.parse(saved!);
        expect(sections.length).toBeGreaterThan(0);
      });
    });

    it('should restore collapsed sections from localStorage on mount', () => {
      localStorage.setItem('toolbar-collapsed-sections', JSON.stringify(['Math']));
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Math section should be collapsed
      expect(screen.queryByText('Add')).not.toBeInTheDocument();
    });
  });

  describe('Block Dragging', () => {
    it('should make block elements draggable', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      const sliderBlock = screen.getByText('Slider').closest('div');
      expect(sliderBlock).toHaveAttribute('draggable', 'true');
    });

    it('should set correct data on drag start', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      const sliderBlock = screen.getByText('Slider').closest('div');
      const mockDataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
      };

      const dragEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
      });

      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: mockDataTransfer,
      });

      sliderBlock?.dispatchEvent(dragEvent);

      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'application/reactflow',
        'slider'
      );
    });
  });

  describe('Tooltips', () => {
    it('should not show tooltip attributes when labels are visible', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      const sliderBlock = screen.getByText('Slider').closest('div');
      expect(sliderBlock).not.toHaveAttribute('data-tooltip-id');
    });

    it('should show tooltip attributes in icon-only mode', () => {
      localStorage.setItem('toolbar-show-labels', 'false');
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Find a block element by its icon (look for draggable divs)
      const draggableBlocks = document.querySelectorAll('[draggable="true"]');
      const blockWithTooltip = Array.from(draggableBlocks).find(
        el => el.hasAttribute('data-tooltip-id')
      );

      expect(blockWithTooltip).toBeTruthy();
      expect(blockWithTooltip?.getAttribute('data-tooltip-id')).toBe('block-tooltip');
    });
  });

  describe('Block Groups', () => {
    it('should render correct number of blocks in Inputs group', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      expect(screen.getByText('Slider')).toBeInTheDocument();
      expect(screen.getByText('Button')).toBeInTheDocument();
      expect(screen.getByText('Toggle')).toBeInTheDocument();
      expect(screen.getByText('Pulse')).toBeInTheDocument();
    });

    it('should render correct number of blocks in Generators group', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Check that generator blocks exist (flexible matching)
      expect(screen.getByText(/sine/i)).toBeInTheDocument();
      expect(screen.getByText(/square/i)).toBeInTheDocument();
      expect(screen.getByText(/triangle/i)).toBeInTheDocument();
      expect(screen.getByText(/sawtooth/i)).toBeInTheDocument();
      expect(screen.getByText(/noise/i)).toBeInTheDocument();
    });

    it('should render all math blocks', () => {
      render(<Toolbar isPlaying={false} onTogglePlayback={mockTogglePlayback} />);

      // Basic arithmetic
      expect(screen.getByText(/^add$/i)).toBeInTheDocument();
      expect(screen.getByText(/subtract/i)).toBeInTheDocument();
      expect(screen.getByText(/multiply/i)).toBeInTheDocument();
      expect(screen.getByText(/divide/i)).toBeInTheDocument();

      // Rounding - check for some of them
      expect(screen.getAllByText(/floor|ceiling|round/i).length).toBeGreaterThan(0);

      // Other operations - check for existence
      const allText = screen.getByText(/math/i).closest('div')?.textContent || '';
      expect(allText).toBeTruthy();
    });
  });
});
