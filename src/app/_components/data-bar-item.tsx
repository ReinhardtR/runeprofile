"use client";

import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";

type DataBarItem = {
  name: string;
  icon: string;
  content: React.ReactNode;
};

export const DataBarItem: React.FC<DataBarItem> = ({ icon, name, content }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Image
          alt={name}
          src={icon}
          width={32}
          height={32}
          className="drop-shadow-solid-sm"
          quality={100}
        />
      </TooltipTrigger>
      <TooltipContent className="pointer-events-none mt-4 px-4 pb-4 pt-5">
        {content}
      </TooltipContent>
    </Tooltip>
  );
};
