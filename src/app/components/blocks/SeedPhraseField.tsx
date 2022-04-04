import { forwardRef, useRef } from "react";
import classNames from "clsx";
import mergeRefs from "react-merge-refs";
import { useCopyToClipboard } from "lib/react-hooks/useCopyToClipboard";
import { usePasteFromClipboard } from "lib/react-hooks/usePasteFromClipboard";
import { ethers } from "ethers";

import { getRandomBytes } from "lib/crypto-utils/random";

import { TippySingletonProvider } from "app/hooks";
import IconedButton from "app/components/elements/IconedButton";
import LongTextField, {
  LongTextFieldProps,
} from "app/components/elements/LongTextField";
import NewButton from "app/components/elements/NewButton";
import { ReactComponent as EyeIcon } from "app/icons/eye.svg";
import { ReactComponent as RegenerateIcon } from "app/icons/refresh.svg";
import { ReactComponent as DownloadIcon } from "app/icons/download.svg";
import { ReactComponent as UploadIcon } from "app/icons/upload.svg";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import { ReactComponent as PasteIcon } from "app/icons/paste.svg";
import { ReactComponent as SuccessIcon } from "app/icons/success.svg";
import { useDialog } from "app/hooks/dialog";

type SeedPhraseFieldProps =
  | CreateSeedPhraseFieldProps
  | ImportSeedPhraseFieldProps;

const SeedPhraseField = forwardRef<HTMLTextAreaElement, SeedPhraseFieldProps>(
  ({ className, ...rest }, ref) => (
    <div className={classNames("w-full max-w-[27.5rem] relative", className)}>
      {"setFromClipboard" in rest ? (
        <ImportSeedPhraseField ref={ref} {...rest} />
      ) : (
        <CreateSeedPhraseField ref={ref} {...rest} />
      )}
    </div>
  )
);

export default SeedPhraseField;

type CreateSeedPhraseFieldProps = LongTextFieldProps & {
  onRegenerate?: () => void;
};

const CreateSeedPhraseField = forwardRef<
  HTMLTextAreaElement,
  CreateSeedPhraseFieldProps
>(({ onRegenerate, ...rest }, ref) => {
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const { copy, copied } = useCopyToClipboard(fieldRef);

  const { confirm } = useDialog();

  const handleDownload = () => {
    const value = fieldRef.current?.value ?? "";
    if (value) {
      confirm({
        title: "Download Secret Phrase",
        content: `
        WARNING: Never disclose your Secret Recovery Phrase. Anyone with this phrase can take your Ether forever.
        Download this Secret Recovery Phrase and keep it stored safely on an external encrypted hard drive or storage medium.`,
      }).then((answer) => {
        if (answer) {
          const name = ethers.utils.base58.encode(getRandomBytes(10));
          download(name, value);
        }
      });
    }
  };

  return (
    <>
      <LongTextField
        ref={mergeRefs([ref, fieldRef])}
        id="seedPhrase"
        label="Secret Phrase"
        readOnly
        actions={
          <div className="flex items-center">
            <TippySingletonProvider>
              <IconedButton
                aria-label="Show / hide"
                Icon={EyeIcon}
                className="mr-2"
                theme="secondary"
              />
              {onRegenerate && (
                <IconedButton
                  aria-label="Regenerate secret phrase"
                  Icon={RegenerateIcon}
                  onClick={onRegenerate}
                  className="mr-2"
                  theme="secondary"
                />
              )}
              <IconedButton
                aria-label="Download secret phrase"
                onClick={handleDownload}
                Icon={DownloadIcon}
                theme="secondary"
              />
            </TippySingletonProvider>
          </div>
        }
        {...rest}
      />
      <NewButton
        type="button"
        theme="tertiary"
        onClick={copy}
        className={classNames(
          "absolute bottom-[1.125rem] right-3",
          "text-sm text-brand-light",
          "!p-0 !pr-1 !min-w-0",
          "!font-normal",
          "cursor-copy",
          "items-center"
        )}
      >
        {copied ? (
          <SuccessIcon className="mr-1" />
        ) : (
          <CopyIcon className="mr-1" />
        )}
        {copied ? "Copied" : "Copy"}
      </NewButton>
    </>
  );
});

type ImportSeedPhraseFieldProps = LongTextFieldProps & {
  setFromClipboard: (value: string) => void;
};

const ImportSeedPhraseField = forwardRef<
  HTMLTextAreaElement,
  ImportSeedPhraseFieldProps
>(({ setFromClipboard, ...rest }, ref) => {
  const { paste, pasted } = usePasteFromClipboard(setFromClipboard);

  return (
    <>
      <LongTextField
        ref={ref}
        id="seedPhrase"
        label="Secret Phrase"
        actions={
          <div className="flex items-center">
            <TippySingletonProvider>
              <IconedButton
                aria-label="Show / hide"
                Icon={EyeIcon}
                className="mr-2"
                theme="secondary"
              />
              <IconedButton
                aria-label="Upload secret phrase"
                Icon={UploadIcon}
                theme="secondary"
              />
            </TippySingletonProvider>
          </div>
        }
        {...rest}
      />
      <NewButton
        type="button"
        theme="tertiary"
        onClick={paste}
        className={classNames(
          "absolute bottom-[1.125rem] right-3",
          "text-sm text-brand-light",
          "!p-0 !pr-1 !min-w-0",
          "!font-normal",
          "cursor-copy",
          "items-center"
        )}
      >
        {pasted ? (
          <SuccessIcon className="mr-1" />
        ) : (
          <PasteIcon className="mr-1" />
        )}
        {pasted ? "Pasted" : "Paste"}
      </NewButton>
    </>
  );
});

function download(filename: string, text: string) {
  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/richtext," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
