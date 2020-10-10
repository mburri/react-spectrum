/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {useComboBox} from '@react-aria/combobox';
import ChevronDownMedium from '@spectrum-icons/ui/ChevronDownMedium';
import {classNames, unwrapDOMRef, useDOMRef, useIsMobileDevice} from '@react-spectrum/utils';
import {useComboBoxState} from '@react-stately/combobox';
import {DismissButton, useOverlayPosition} from '@react-aria/overlays';
import {DOMRef, DOMRefValue, FocusableRefValue} from '@react-types/shared';
import {FieldButton} from '@react-spectrum/button';
import {FocusRing} from '@react-aria/focus';
import {ListBoxBase, useListBoxLayout} from '@react-spectrum/listbox';
import {useLayoutEffect} from '@react-aria/utils';
import {Placement} from '@react-types/overlays';
import {Popover} from '@react-spectrum/overlays';
import {PressResponder, useHover} from '@react-aria/interactions';
import React, {InputHTMLAttributes, ReactElement, RefObject, useRef, useState} from 'react';
import {SpectrumComboBoxProps} from '@react-types/combobox';
import styles from '@adobe/spectrum-css-temp/components/inputgroup/vars.css';
import {TextFieldBase} from '@react-spectrum/textfield';
import {TextFieldRef} from '@react-types/textfield';
import {useCollator} from '@react-aria/i18n';
import {useProvider, useProviderProps} from '@react-spectrum/provider';

import {MobileComboBox} from './MobileComboBox';
import {Field} from '@react-spectrum/label';
import {AriaButtonProps} from '@react-types/button';

function ComboBox<T extends object>(props: SpectrumComboBoxProps<T>, ref: RefObject<TextFieldRef>) {
  props = useProviderProps(props);

  let isMobile = useIsMobileDevice();

  if (isMobile) {
    return <MobileComboBox {...props} ref={ref} />;
  } else {
    return <ComboBoxBase {...props} ref={ref} />;
  }
}

const ComboBoxBase = React.forwardRef(function ComboBoxBase<T extends object>(props: SpectrumComboBoxProps<T>, ref: RefObject<TextFieldRef>) {
  let {
    menuTrigger = 'input',
    shouldFlip = true,
    direction = 'bottom'
  } = props;

  let popoverRef = useRef<DOMRefValue<HTMLDivElement>>();
  let triggerRef = useRef<FocusableRefValue<HTMLElement>>();
  let listboxRef = useRef();
  let inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>();
  let collator = useCollator({sensitivity: 'base'});
  let state = useComboBoxState({...props, collator});
  let layout = useListBoxLayout(state);

  let {triggerProps, inputProps, listBoxProps, labelProps} = useComboBox(
    {
      ...props,
      layout,
      triggerRef: unwrapDOMRef(triggerRef),
      popoverRef: unwrapDOMRef(popoverRef),
      inputRef: inputRef,
      menuTrigger
    },
    state
  );

  let {overlayProps, placement} = useOverlayPosition({
    targetRef: unwrapDOMRef(triggerRef),
    overlayRef: unwrapDOMRef(popoverRef),
    scrollRef: listboxRef,
    placement: `${direction} end` as Placement,
    shouldFlip: shouldFlip,
    isOpen: state.isOpen,
    onClose: state.close
  });

  // Measure the width of the inputfield and the button to inform the width of the menu (below).
  let [menuWidth, setMenuWidth] = useState(null);
  let {scale} = useProvider();

  useLayoutEffect(() => {
    let buttonWidth = triggerRef.current.UNSAFE_getDOMNode().offsetWidth;
    let inputWidth = inputRef.current.offsetWidth;
    setMenuWidth(buttonWidth + inputWidth);
  }, [scale, triggerRef, inputRef]);

  let style = {
    ...overlayProps.style,
    width: menuWidth
  };

  return (
    <>
      <Field {...props} labelProps={labelProps} ref={ref}>
        <ComboBoxInput
          {...props}
          inputProps={inputProps}
          inputRef={inputRef}
          triggerProps={triggerProps}
          triggerRef={triggerRef} />
      </Field>
      <Popover
        isOpen={state.isOpen}
        UNSAFE_style={style}
        ref={popoverRef}
        placement={placement}
        hideArrow
        shouldCloseOnBlur
        onClose={state.close}>
        <DismissButton onDismiss={() => state.close()} />
        <ListBoxBase
          ref={listboxRef}
          domProps={listBoxProps}
          disallowEmptySelection
          autoFocus={state.focusStrategy}
          shouldSelectOnPressUp
          focusOnPointerEnter
          layout={layout}
          state={state}
          // Set max height: inherit so Tray scrolling works
          UNSAFE_style={{maxHeight: 'inherit'}}
          shouldUseVirtualFocus />
        <DismissButton onDismiss={() => state.close()} />
      </Popover>
    </>
  );
});

interface ComboBoxInputProps extends SpectrumComboBoxProps<unknown> {
  inputProps: InputHTMLAttributes<HTMLInputElement>,
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement>,
  triggerProps: AriaButtonProps,
  triggerRef: RefObject<FocusableRefValue<HTMLElement>>,
  className?: string
}

const ComboBoxInput = React.forwardRef(function ComboBoxInput(props: ComboBoxInputProps, ref: DOMRef<HTMLDivElement>) {
  let {
    isQuiet,
    isDisabled,
    isReadOnly,
    validationState,
    inputProps,
    inputRef,
    triggerProps,
    triggerRef,
    autoFocus,
    className
  } = props;
  let {hoverProps, isHovered} = useHover({});
  let domRef = useDOMRef(ref);

  return (
    <FocusRing
      within
      isTextInput
      focusClass={classNames(styles, 'is-focused')}
      focusRingClass={classNames(styles, 'focus-ring')}
      autoFocus={autoFocus}>
      <div
        {...hoverProps}
        ref={domRef}
        className={
          classNames(
            styles,
            'spectrum-InputGroup',
            {
              'spectrum-InputGroup--quiet': isQuiet,
              'is-disabled': isDisabled,
              'is-invalid': validationState === 'invalid',
              'is-hovered': isHovered
            },
            className
          )
        }>
        <TextFieldBase
          inputProps={inputProps}
          inputRef={inputRef}
          inputClassName={
            classNames(
              styles,
              'spectrum-InputGroup-field'
            )
          }
          isDisabled={isDisabled}
          isQuiet={isQuiet}
          validationState={validationState}
          flex={1} />
        <PressResponder preventFocusOnPress>
          <FieldButton
            {...triggerProps}
            ref={triggerRef}
            UNSAFE_className={
              classNames(
                styles,
                'spectrum-FieldButton'
              )
            }
            isDisabled={isDisabled || isReadOnly}
            isQuiet={isQuiet}
            validationState={validationState}>
            <ChevronDownMedium UNSAFE_className={classNames(styles, 'spectrum-Dropdown-chevron')} />
          </FieldButton>
        </PressResponder>
      </div>
    </FocusRing>
  );
});

const _ComboBox = React.forwardRef(ComboBox) as <T>(props: SpectrumComboBoxProps<T> & {ref?: RefObject<TextFieldRef>}) => ReactElement;
export {_ComboBox as ComboBox};
