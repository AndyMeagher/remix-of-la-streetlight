import { SVGProps } from "react";

const Butterfly = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* body */}
    <line x1="12" y1="6" x2="12" y2="19" />
    {/* antennae */}
    <path d="M12 6c-.5-1.2-1.4-2-2.3-2.3" />
    <path d="M12 6c.5-1.2 1.4-2 2.3-2.3" />
    {/* left wings */}
    <path d="M12 8c-2-3-5-4-7-3-1.5.8-2 3-1 5 .8 1.5 2.5 2 4 1.5" />
    <path d="M12 14c-1.5-1-3.5-1-5 0-1.2.8-1.5 2.5-.5 3.8 1 1.2 3 1.2 4.5 0L12 17" />
    {/* right wings */}
    <path d="M12 8c2-3 5-4 7-3 1.5.8 2 3 1 5-.8 1.5-2.5 2-4 1.5" />
    <path d="M12 14c1.5-1 3.5-1 5 0 1.2.8 1.5 2.5.5 3.8-1 1.2-3 1.2-4.5 0L12 17" />
  </svg>
);

export default Butterfly;
