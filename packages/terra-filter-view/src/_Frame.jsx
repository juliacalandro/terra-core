import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames/bind';
import 'terra-base/lib/baseStyles';
import Button from 'terra-button';
import IconSearch from 'terra-icon/lib/icon/IconSearch';
import IconIncomplete from 'terra-icon/lib/icon/IconIncomplete';
import { KeyCodes, Variants } from './_constants';
import Dropdown from './_Dropdown';
import Util from './_FrameUtil';
import styles from './_Frame.module.scss';

const cx = classNames.bind(styles);

const Icon = <IconSearch />;

const propTypes = {
  /**
   * Whether the select is disabled.
   */
  disabled: PropTypes.bool,
  /**
   * When true, will disable the auto-search.
   */
  disableAutoSearch: PropTypes.bool,
  /**
   * The select display.
   */
  display: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /**
   * A render callback for dropdown content.
   */
  dropdown: PropTypes.func,
  /**
   * Additional attributes to spread onto the dropdown. ( Style, ClassNames, etc.. )
   */
  dropdownAttrs: PropTypes.shape({}),
  /**
   * Whether the select is in an invalid state.
   */
  isInvalid: PropTypes.bool,
  /**
   * The minimum number of characters to perform a search.
   */
  minimumSearchTextLength: PropTypes.number,
  /**
   * Content to display when no search results are found.
   */
  noResultContent: PropTypes.node,
  /**
   * Callback function triggered when an option is deselected.
   */
  onDeselect: PropTypes.func,
  /**
   * Callback function triggered when the frame loses focus.
   */
  onBlur: PropTypes.func,
  /**
   * Callback function triggered when the frame gains focus.
   */
  onFocus: PropTypes.func,
  /**
   * A callback to indicate an invalid search.
   */
  onInvalidSearch: PropTypes.func,
  /**
   * Callback function triggered when the search criteria changes.
   */
  onSearch: PropTypes.func,
  /**
   * Callback function triggered when an option is selected.
   */
  onSelect: PropTypes.func,
  /**
   * Callback function for option filtering. function(searchValue, option)
   */
  optionFilter: PropTypes.func,
  /**
   * Placeholder text.
   */
  placeholder: PropTypes.string,
  /**
   * how long the component should wait (in milliseconds) after input before performing an automatic search.
   */
  searchDelay: PropTypes.number,
  /**
   * Controls whether or not all results are shown on initial load or after input focus.
   */
  showResultsInitially: PropTypes.bool,
  /**
   * The select value.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.array]),
  /**
   * The behavior of the select.
   */
  variant: PropTypes.oneOf([
    Variants.DROPDOWN,
    Variants.LIST,
  ]),
};

const defaultProps = {
  disabled: false,
  dropdown: undefined,
  dropdownAttrs: undefined,
  isInvalid: false,
  noResultContent: undefined,
  onDeselect: undefined,
  onSearch: undefined,
  onSelect: undefined,
  optionFilter: undefined,
  placeholder: undefined,
  value: undefined,
  variant: Variants.DROPDOWN,
};

/* This rule can be removed when eslint-plugin-jsx-a11y is updated to ~> 6.0.0 */
/* eslint-disable jsx-a11y/no-static-element-interactions */
class Frame extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      excludeBlur: false,
      isOpen: props.variant === Variants.LIST && props.showResultsInitially,
      isFocused: false,
      isPositioned: false,
      hasSearchChanged: false,
      searchValue: '',
      showResults: props.showResultsInitially,
    };

    this.setInput = this.setInput.bind(this);
    this.getDisplay = this.getDisplay.bind(this);
    this.clearSearch = this.clearSearch.bind(this);
    this.clearSearchTimeout = this.clearSearchTimeout.bind(this);
    this.delaySearch = this.delaySearch.bind(this);
    this.openDropdown = this.openDropdown.bind(this);
    this.closeDropdown = this.closeDropdown.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.positionDropdown = this.positionDropdown.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleFocus = this.handleFocus.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleInputMouseDown = this.handleInputMouseDown.bind(this);
  }

  componentDidUpdate(previousProps, previousState) {
    if (this.props.variant === Variants.DROPDOWN && Util.shouldPositionDropdown(previousState, this.state, this.dropdown)) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(this.positionDropdown, !previousState.isOpen ? 0 : 100);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.debounceTimer);
  }

  setInput(input) {
    this.input = input;
  }

  getDisplay() {
    const { searchValue } = this.state;
    const { disabled, placeholder } = this.props;

    const inputAttrs = {
      disabled,
      placeholder,
      ref: this.setInput,
      onChange: this.handleSearch,
      onMouseDown: this.handleInputMouseDown,
      'aria-label': 'search',
      className: cx('search-input'),
    };

    return <input {...inputAttrs} value={searchValue} />;
  }

  /**
   * Clears the search-bar content.
   */
  clearSearch(event) {
    event.preventDefault();
    if (this.state.searchValue !== '') {
      this.setState({ searchValue: '', hasSearchChanged: true, excludeBlur: false });
    }
  }

  /**
   * Closes the dropdown.
   */
  closeDropdown() {
    // Don't clear the search value when closing the dropdown
    if (this.props.variant !== Variants.LIST) {
      this.setState({
        isAbove: false,
        isFocused: document.activeElement === this.input || document.activeElement === this.select,
        isOpen: false,
        isPositioned: false,
        hasSearchChanged: true,
      });
    } else {
      this.setState({ isFocused: document.activeElement === this.input || document.activeElement === this.select });
    }
  }

  /**
   * Opens the dropdown.
   */
  openDropdown() {
    if (this.state.isOpen || this.props.disabled) {
      return;
    }

    if (this.input) {
      this.input.focus();
    }

    this.setState({ isOpen: true, isFocused: true, isPositioned: false });
  }

  /**
   * Positions the dropdown to utilize the most available space.
   */
  positionDropdown() {
    if (!this.state.isOpen) {
      return;
    }

    const { dropdownAttrs } = this.props;
    const { select, dropdown, state } = this;
    this.setState(Util.dropdownPosition(dropdownAttrs, state, select, dropdown));
  }

  /**
   * Handles the blur event.
   */
  handleBlur(event) {
    if (!this.state.excludeBlur) {
      this.closeDropdown();
    }

    if (this.props.onBlur) {
      this.props.onBlur(event);
    }
  }

  /**
   * Handles the focus event.
   */
  handleFocus(event) {
    // Show results once input is focused
    if (!this.state.showResults) {
      this.setState({ showResults: true, isOpen: true });
    }
    if (this.props.disabled) {
      return;
    }

    if (!this.state.isFocused) {
      this.setState({ isFocused: true });
    }

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  }

  /**
   * Manages keyboard interactions and accessibility.
   * @param {event} event - The onKeyDown event.
   */
  handleKeyDown(event) {
    const { keyCode, target } = event;
    const { SPACE, UP_ARROW, DOWN_ARROW } = KeyCodes;

    if (keyCode === SPACE && target !== this.input) {
      event.preventDefault();
      this.openDropdown();
    } else if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
      event.preventDefault();
      this.openDropdown();
    } else if (keyCode === KeyCodes.ESCAPE) {
      this.closeDropdown();
    }
  }

  /**
   * Handles the mouse down events.
   * @param {event} event - The mouse down event.
   */
  handleMouseDown(event) {
    if (this.props.variant !== Variants.LIST) {
      // Preventing default events stops the search input from losing focus.
      event.preventDefault();
      this.openDropdown();
    }
  }

  handleMouseLeave() {
    if (this.state.excludeBlur) {
      this.setState({ excludeBlur: false });
    }
  }

  handleMouseEnter() {
    if (!this.state.excludeBlur) {
      this.setState({ excludeBlur: true });
    }
  }
  /**
   * Handles the input mouse down events.
   * @param {event} event - The mouse down event.
   */
  handleInputMouseDown(event) {
    event.stopPropagation();
    if (this.props.variant !== Variants.LIST) {
      this.openDropdown();
    }
  }
  /**
   * Handles changes to the search value.
   * @param {event} event - The input change event.
   */
  handleSearch(event) {
    const searchValue = event.target.value;

    this.setState({
      isOpen: true,
      hasSearchChanged: true,
      searchValue,
    });

    if (!this.searchTimeout && !this.props.disableAutoSearch) {
      this.searchTimeout = setTimeout(this.delaySearch, this.props.searchDelay);
    }
  }

  delaySearch() {
    this.clearSearchTimeout();

    const { searchValue } = { ...this.state };

    if (searchValue.length >= this.props.minimumSearchTextLength && this.props.onSearch) {
      this.props.onSearch(searchValue);
    } else if
    (this.props.onInvalidSearch) {
      this.props.onInvalidSearch(searchValue);
    }
  }

  clearSearchTimeout() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = null;
    }
  }

  /**
   * Handles the request to select an option.
   * @param {string|number} value - The value of the selected option.
   * @param {ReactNode} option - The option that was selected.
   */
  handleSelect(value, option) {
    if (this.props.variant !== Variants.LIST) {
      // Set the search value to the option selected (so that input is clearable)
      this.setState({
        searchValue: option.props.display,
        hasSearchChanged: true,
        isOpen: false,
      });
    }

    if (this.props.onSelect) {
      this.props.onSelect(value, option);
    }
  }

  /**
   * Toggles the dropdown open or closed.
   */
  toggleDropdown() {
    // Trigger search callback on press
    this.delaySearch();
    if (this.props.variant === Variants.LIST) {
      return;
    }
    if (this.state.isOpen && this.props.variant) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  render() {
    const {
      disabled,
      disableAutoSearch,
      display,
      dropdown,
      dropdownAttrs,
      isInvalid,
      minimumSearchTextLength,
      noResultContent,
      onDeselect,
      onInvalidSearch,
      onSearch,
      onSelect,
      optionFilter,
      placeholder,
      searchDelay,
      showResultsInitially,
      variant,
      value,
      ...customProps
    } = this.props;

    const selectClasses = cx([
      'select',
      variant,
      { 'is-above': this.state.isAbove },
      { 'is-focused': this.state.isFocused },
      { 'is-open': this.state.isOpen },
      customProps.className,
    ]);

    let ariaOwns;
    if (this.state.isOpen && variant === Variants.DROPDOWN) {
      ariaOwns = 'terra-select-dropdown';
    } else if (variant === Variants.LIST) {
      ariaOwns = 'terra-filter-box';
    }

    return (
      <div className={cx(['select-parent', { 'is-disabled': disabled }])}>
        <div
          {...customProps}
          role="combobox"
          aria-controls={this.state.isOpen ? ariaOwns : undefined}
          aria-disabled={!!disabled}
          aria-expanded={!!this.state.isOpen}
          aria-haspopup={variant === Variants.DROPDOWN ? 'true' : undefined}
          aria-owns={this.state.isOpen ? ariaOwns : undefined}
          className={selectClasses}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          onKeyDown={this.handleKeyDown}
          onMouseDown={this.handleMouseDown}
          ref={(select) => { this.select = select; }}
        >
          <div className={cx(['display', { 'is-disabled': disabled }])} onMouseDown={this.openDropdown} >
            {this.getDisplay()}
          </div>
          {/* Render a clear search button when text is present in input */}
          {this.state.searchValue && this.state.isFocused &&
            <IconIncomplete
              className={cx('clear-button')}
              onClick={this.clearSearch}
              onMouseEnter={this.handleMouseEnter}
              onMouseLeave={this.handleMouseLeave}
            />
          }
          <Button
            className={cx(['button'])}
            onMouseDown={this.toggleDropdown}
            icon={Icon}
            text="Search"
            isIconOnly
            isCompact
          />
          {/* If variant is dropdown, render the dropdown */}
          {variant === Variants.DROPDOWN && this.state.isOpen &&
            <Dropdown
              {...dropdownAttrs}
              id="terra-select-dropdown"
              target={this.select}
              isAbove={this.state.isAbove}
              isEnabled={this.state.isPositioned}
              onResize={this.positionDropdown}
              refCallback={(ref) => { this.dropdown = ref; }}
              style={Util.dropdownStyle(dropdownAttrs, this.state)}
            >
              {dropdown &&
                 dropdown({
                   value,
                   onDeselect,
                   optionFilter,
                   noResultContent,
                   onSelect: this.handleSelect,
                   onRequestClose: this.closeDropdown,
                   searchValue: this.state.searchValue,
                 })}
            </Dropdown>
          }
        </div>
        {/* If variant is persistent, render the result box */}
        {variant === Variants.LIST &&
          <div {...dropdownAttrs} className={cx(['box'])} id="terra-filter-box">
            {dropdown && this.state.showResults && dropdown({
              disabled,
              value,
              onDeselect,
              optionFilter,
              noResultContent,
              onSelect: this.handleSelect,
              onRequestClose: this.closeDropdown,
              searchValue: this.state.searchValue,
            })}
          </div>
        }
      </div>
    );
  }
}

Frame.propTypes = propTypes;
Frame.defaultProps = defaultProps;

export default Frame;