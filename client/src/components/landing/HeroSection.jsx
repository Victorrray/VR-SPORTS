import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

function PrimaryButtonDesktop() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/login')} className="px-8 py-3 md:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all text-center font-semibold flex items-center gap-2">
      Get started
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}

function SecondaryButtonDesktop() {
  const navigate = useNavigate();
  return (
    <button onClick={() => { const el = document.querySelector('.features-section-new'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-visible px-[16px] py-[12px] relative rounded-[12px] shrink-0" data-name="Secondary button">
      <div aria-hidden="true" className="absolute border-2 border-[rgba(255,255,255,0.15)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-nowrap text-white tracking-[-0.09px]">
        <p className="leading-[1.45] whitespace-pre">See Live Demo</p>
      </div>
    </button>
  );
}

function ButtonsDesktop() {
  return (
    <div className="content-end cursor-pointer flex flex-wrap gap-[16px] items-end justify-center relative shrink-0" data-name="Buttons">
      <PrimaryButtonDesktop />
      <SecondaryButtonDesktop />
    </div>
  );
}

function TextDesktop() {
  return (
    <div className="content-stretch flex flex-col gap-[48px] items-center relative shrink-0 w-full" data-name="Text">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[1.1] not-italic relative shrink-0 text-[64px] text-center text-white tracking-[-1.28px] w-[740px]">
        <h1 className="block mb-0">A bold headline</h1>
        <h1 className="block">that delivers</h1>
      </div>
      <ButtonsDesktop />
    </div>
  );
}

function Hero1Desktop() {
  return (
    <section className="relative size-full" data-name="Hero 1">
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[120px] items-center pb-0 pt-[120px] px-[64px] relative size-full">
          <TextDesktop />
          <div aria-hidden="true" className="h-[599px] pointer-events-none relative rounded-[32px] shrink-0 w-[922px]" data-name="Device frame" role="presentation">
            <div aria-hidden="true" className="absolute border-8 border-solid border-white inset-0 rounded-[32px] shadow-[0px_0px_4.4px_0px_rgba(0,0,0,0.06),0px_5px_19px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PrimaryButtonTablet() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/login')} className="bg-white box-border content-stretch flex gap-[8px] items-center justify-center overflow-visible px-[16px] py-[12px] relative rounded-[12px] shrink-0" data-name="Primary button">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-black text-nowrap tracking-[-0.09px]">
        <p className="leading-[1.45] whitespace-pre">Get Started Today</p>
      </div>
    </button>
  );
}

function SecondaryButtonTablet() {
  return (
    <button onClick={() => { const el = document.querySelector('.features-section-new'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-visible px-[16px] py-[12px] relative rounded-[12px] shrink-0" data-name="Secondary button">
      <div aria-hidden="true" className="absolute border-2 border-[rgba(255,255,255,0.15)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-nowrap text-white tracking-[-0.09px]">
        <p className="leading-[1.45] whitespace-pre">See Live Demo</p>
      </div>
    </button>
  );
}

function ButtonsTablet() {
  return (
    <div className="content-end cursor-pointer flex flex-wrap gap-[16px] items-end justify-center relative shrink-0" data-name="Buttons">
      <PrimaryButtonTablet />
      <SecondaryButtonTablet />
    </div>
  );
}

function TextTablet() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-full" data-name="Text">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[1.1] not-italic relative shrink-0 text-[56px] text-center text-white tracking-[-1.12px] w-[672px]">
        <h1 className="block mb-0">A bold headline</h1>
        <h1 className="block">that delivers</h1>
      </div>
      <ButtonsTablet />
    </div>
  );
}

function Hero1Tablet() {
  return (
    <section className="relative size-full" data-name="Hero 1">
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[96px] items-center pb-0 pt-[96px] px-[64px] relative size-full">
          <TextTablet />
          <div aria-hidden="true" className="aspect-[608/395] pointer-events-none relative rounded-[24px] shrink-0 w-full" data-name="Device frame" role="presentation">
            <div aria-hidden="true" className="absolute border-8 border-solid border-white inset-0 rounded-[24px] shadow-[0px_0px_4.4px_0px_rgba(0,0,0,0.06),0px_5px_19px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PrimaryButtonMobile() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate('/login')} className="bg-white relative rounded-[12px] shrink-0 w-full" data-name="Primary button">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[12px] relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Medium',sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[16px] text-black text-center text-nowrap tracking-[-0.08px]">
            <p className="[white-space-collapse:collapse] leading-[1.45] overflow-ellipsis overflow-hidden">Get Started Today</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function SecondaryButtonMobile() {
  return (
    <button onClick={() => { const el = document.querySelector('.features-section-new'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="relative rounded-[12px] shrink-0 w-full" data-name="Secondary button">
      <div aria-hidden="true" className="absolute border-2 border-[rgba(255,255,255,0.15)] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="flex flex-row items-center justify-center size-full">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center px-[16px] py-[12px] relative w-full">
          <div className="basis-0 flex flex-col font-['Inter:Medium',sans-serif] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[18px] text-center text-nowrap text-white tracking-[-0.09px]">
            <p className="[white-space-collapse:collapse] leading-[1.45] overflow-ellipsis overflow-hidden">See Live Demo</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function ButtonsMobile() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col gap-[12px] items-end justify-center relative shrink-0 w-full" data-name="Buttons">
      <PrimaryButtonMobile />
      <SecondaryButtonMobile />
    </div>
  );
}

function TextMobile() {
  return (
    <div className="content-stretch flex flex-col gap-[40px] items-center relative shrink-0 w-full" data-name="Text">
      <div className="flex flex-col font-['Inter:Bold',sans-serif] font-bold justify-center leading-[1.1] not-italic relative shrink-0 text-[44px] text-center text-white tracking-[-0.88px] w-full">
        <h1 className="block mb-0">A bold headline</h1>
        <h1 className="block">that delivers</h1>
      </div>
      <ButtonsMobile />
    </div>
  );
}

function Hero1Mobile() {
  return (
    <section className="relative size-full" data-name="Hero 1">
      <div className="flex flex-col items-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[64px] items-center px-[24px] py-[64px] relative size-full">
          <TextMobile />
          <div aria-hidden="true" className="aspect-[311/202] pointer-events-none relative rounded-[16px] shrink-0 w-full" data-name="Device frame" role="presentation">
            <div aria-hidden="true" className="absolute border-8 border-solid border-white inset-0 rounded-[16px] shadow-[0px_0px_4.4px_0px_rgba(0,0,0,0.06),0px_5px_19px_0px_rgba(0,0,0,0.08)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Hero() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width < 800) {
    return <Hero1Mobile />;
  }
  if (width < 1280) {
    return <Hero1Tablet />;
  }
  return <Hero1Desktop />;
}
