import { Fragment, type CSSProperties } from 'react';

type LinkifiedTextProps = {
  text: string;
  className?: string;
  style?: CSSProperties;
};

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

export default function LinkifiedText({ text, className, style }: LinkifiedTextProps) {
  const parts = text.split(URL_PATTERN);

  return (
    <div className={className} style={style}>
      {parts.map((part, index) => {
        if (!/^(https?:\/\/|www\.)/i.test(part)) return part;
        const match = part.match(/^(.*?)([.,!?;:)]+)?$/);
        const linkText = match?.[1] || part;
        const trailing = match?.[2] || '';
        const href = /^www\./i.test(linkText) ? `https://${linkText}` : linkText;
        return (
          <Fragment key={`${part}-${index}`}>
            <a
              className="comment-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
            >
              {linkText}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </div>
  );
}
