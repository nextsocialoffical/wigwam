import { forwardRef, useRef } from "react";
import mergeRefs from "react-merge-refs";
import classNames from "clsx";
import { useCopyToClipboard } from "lib/react-hooks/useCopyToClipboard";
import { usePasteFromClipboard } from "lib/react-hooks/usePasteFromClipboard";

import LongTextField, { LongTextFieldProps } from "./LongTextField";
import NewButton from "./NewButton";
import { ReactComponent as SuccessIcon } from "app/icons/success.svg";
import { ReactComponent as PasteIcon } from "app/icons/paste.svg";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";

type AddressFieldProps = LongTextFieldProps & {
  setFromClipboard?: (value: string) => void;
};

const AddressField = forwardRef<HTMLTextAreaElement, AddressFieldProps>(
  ({ label = "Recipient", setFromClipboard, className, ...rest }, ref) => {
    const longTextFieldRef = useRef(null);

    const { paste, pasted } = usePasteFromClipboard(setFromClipboard);
    const { copy, copied } = useCopyToClipboard(longTextFieldRef);

    return (
      <LongTextField
        ref={mergeRefs([ref, longTextFieldRef])}
        label={label}
        placeholder="0x0000000000000000000000000000000000000000"
        textareaClassName="!h-20"
        maxLength={42}
        actions={
          <NewButton
            theme="tertiary"
            onClick={() => {
              if (setFromClipboard) {
                paste();
              } else {
                copy();
              }
            }}
            className={classNames(
              "absolute bottom-3 right-3",
              "text-sm text-brand-light",
              "!p-0 !pr-1 !min-w-0",
              "!font-normal",
              !setFromClipboard && "cursor-copy",
              "items-center"
            )}
          >
            {setFromClipboard ? (
              <>
                {pasted ? (
                  <SuccessIcon className="mr-1" />
                ) : (
                  <PasteIcon className="mr-1" />
                )}
                {pasted ? "Pasted" : "Paste"}
              </>
            ) : (
              <>
                {copied ? (
                  <SuccessIcon className="mr-1" />
                ) : (
                  <CopyIcon className="mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </>
            )}
          </NewButton>
        }
        className={className}
        {...rest}
      />
    );
  }
);

export default AddressField;
