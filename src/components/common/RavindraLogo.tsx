import React from 'react';
import logoImage from '../../assets/images/ravindra_pro_logo_1792394034899.jpg';

interface RavindraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  className?: string;
}

export const RavindraLogo: React.FC<RavindraLogoProps> = ({
  size = 'md',
  showText = true,
  textColor = 'text-stone-900',
  className = '',
}) => {
  const sizeMap = {
    sm: { img: 'w-8 h-8', textTitle: 'text-sm font-extrabold', textSub: 'text-[10px]' },
    md: { img: 'w-10 h-10', textTitle: 'text-base font-extrabold', textSub: 'text-xs' },
    lg: { img: 'w-16 h-16', textTitle: 'text-xl font-black', textSub: 'text-xs' },
    xl: { img: 'w-24 h-24', textTitle: 'text-2xl font-black', textSub: 'text-sm' },
  };

  const { img, textTitle, textSub } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative ${img} rounded-xl overflow-hidden shadow-sm shadow-red-500/20 ring-2 ring-amber-400/40 flex-shrink-0 bg-white`}>
        <img
          src={logoImage}
          alt="Ravindra Pro Orders Logo"
          className="w-full h-full object-cover"
        />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${textTitle} tracking-tight ${textColor}`}>
              RAVINDRA <span className="text-red-600">PRO</span>
            </span>
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow-xs">
              Ordering App
            </span>
          </div>
          <span className={`${textSub} text-stone-500 font-medium tracking-wide uppercase`}>
            Hostel Express Delivery
          </span>
        </div>
      )}
    </div>
  );
};
