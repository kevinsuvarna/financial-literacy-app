import type { ComponentPropsWithoutRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import {
  buttonClasses,
  buttonLinkClasses,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles';

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: ComponentPropsWithoutRef<'button'> & ButtonStyleProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />;
}

export function ButtonLink({ variant, size, className, ...rest }: LinkProps & ButtonStyleProps) {
  return <Link className={buttonLinkClasses(variant, size, className)} {...rest} />;
}
