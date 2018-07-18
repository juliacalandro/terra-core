/* eslint-disable */
import React from 'react';
import IconBase from '../IconBase';

const SvgIcon = (customProps) => {
  const attributes = Object.assign({}, customProps);

  return (
    <IconBase {...attributes}>
      <path fill="#FDB06C" d="M46.7 47H25.3L36 28.5z" ></path><path fill="#171B1D" d="M47.9 47.1L36.5 27.4c-.1-.3-.3-.4-.5-.4s-.4.1-.5.4L24.1 47.1c-.3.5 0 .9.5.9h22.8c.5 0 .8-.4.5-.9zM25.3 47L36 28.5 46.7 47H25.3zm9.7-3h2v2h-2v-2zm2-11v9h-2v-9h2z" ></path><path fill="#6F7476" d="M30 0H6v33h10v4.3l14-4.6V0zM19.5 20.1c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5c-.1.8-.7 1.5-1.5 1.5zM16 30H9V3h11.9L16 4.6V30z" ></path>
    </IconBase>
  );
};

SvgIcon.displayName = "IconDischargeComingDueLowLight";
SvgIcon.defaultProps = {"viewBox":"0 0 48 48","xmlns":"http://www.w3.org/2000/svg"};

export default SvgIcon;
/* eslint-enable */
