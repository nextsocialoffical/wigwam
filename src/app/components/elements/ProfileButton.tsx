import { FC, useMemo, useRef, useState, useCallback } from "react";
import { useAtomValue } from "jotai";
import classNames from "clsx";
import Fuse from "fuse.js";
import { isPopup as isPopupPrimitive } from "lib/ext/view";
import { replaceT, useI18NUpdate } from "lib/ext/react";

import { Account } from "core/types";
import { lockWallet } from "core/client";

import { ACCOUNTS_SEARCH_OPTIONS } from "app/defaults";
import { profileStateAtom, approvalsAtom } from "app/atoms";
import { Page } from "app/nav";
import { useAccounts } from "app/hooks";
import { useDialog } from "app/hooks/dialog";
import { ReactComponent as CopyIcon } from "app/icons/copy.svg";
import { ReactComponent as SuccessIcon } from "app/icons/success.svg";
import { ReactComponent as AddWalletIcon } from "app/icons/add-wallet.svg";
import { ReactComponent as NoResultsFoundIcon } from "app/icons/no-results-found.svg";
import { ReactComponent as LockIcon } from "app/icons/lock.svg";
import { ReactComponent as GearIcon } from "app/icons/settings-gear.svg";

import AutoIcon from "./AutoIcon";
import WalletName from "./WalletName";
import HashPreview from "./HashPreview";
import CopiableTooltip from "./CopiableTooltip";
import SecondaryModal, { SecondaryModalProps } from "./SecondaryModal";
import Balance from "./Balance";
import SearchInput from "./SearchInput";
import Button from "./Button";
import ScrollAreaContainer from "./ScrollAreaContainer";

type ProfileButtonProps = {
  className?: string;
};

const ProfileButton: FC<ProfileButtonProps> = ({ className }) => {
  const { currentAccount } = useAccounts();

  const [copied, setCopied] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  return (
    <>
      <div className={classNames("flex items-center gap-6", className)}>
        <CopiableTooltip
          content="Copy wallet address to clipboard"
          textToCopy={currentAccount.address}
          onCopiedToggle={setCopied}
          className={classNames(
            "px-1 pt-1 -mx-1 -mt-1",
            "text-left",
            "rounded",
            "max-w-full",
            "transition-colors",
            "flex items-center",
            "px-2 py-1",
            "bg-brand-main/5 hover:bg-brand-main/10 focus-visible:bg-brand-main/10",
          )}
        >
          <>
            <HashPreview
              hash={currentAccount.address}
              withTooltip={false}
              className="text-sm font-normal leading-none mr-1"
            />
            {copied ? (
              <SuccessIcon className="w-[1.3125rem] h-auto" />
            ) : (
              <CopyIcon className="w-[1.3125rem] h-auto" />
            )}
          </>
        </CopiableTooltip>
        <button
          type="button"
          onClick={() => setModalOpened(true)}
          className={classNames(
            "flex items-center gap-3",
            "py-2 pr-2 pl-4",
            "rounded-xl",
            "transition-colors",
            "hover:bg-brand-main/5 focus-visible:bg-brand-main/5",
          )}
        >
          <WalletName
            wallet={currentAccount}
            className="mb-0.5 text-base font-bold"
          />
          <AutoIcon
            seed={currentAccount.address}
            source="dicebear"
            type="personas"
            className={classNames(
              "h-[3.75rem] w-[3.75rem] min-w-[3.75rem]",
              "bg-black/40",
              "rounded-[.625rem]",
            )}
          />
        </button>
      </div>
      <ProfilesModal open={modalOpened} onOpenChange={setModalOpened} />
    </>
  );
};

export default ProfileButton;

const ProfilesModal: FC<SecondaryModalProps> = ({ onOpenChange, ...rest }) => {
  const { all, currentId } = useAtomValue(profileStateAtom);
  useI18NUpdate();

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [searchValue, setSearchValue] = useState<string | null>(null);

  const currentProfile = useMemo(
    () => all.find((profile) => profile.id === currentId)!,
    [all, currentId],
  );
  const currentName = replaceT(currentProfile.name);
  const currentSeed = currentProfile.avatarSeed;

  const { currentAccount, allAccounts } = useAccounts();

  const fuse = useMemo(
    () => new Fuse(allAccounts, ACCOUNTS_SEARCH_OPTIONS),
    [allAccounts],
  );

  const filteredAccounts = useMemo(() => {
    if (searchValue) {
      return fuse.search(searchValue).map(({ item: account }) => account);
    }
    return allAccounts;
  }, [allAccounts, fuse, searchValue]);

  return (
    <SecondaryModal
      onOpenChange={onOpenChange}
      {...rest}
      className="!max-w-[27.5rem] !p-0"
    >
      <div className="w-full flex flex-col px-5 pt-5">
        <div className="flex items-center text-xl font-bold gap-2 mr-auto mb-6">
          <AutoIcon
            seed={currentSeed}
            source="boring"
            variant="marble"
            autoColors
            initialsSource={currentName}
            className="w-8 h-8 text-5xl"
          />
          {currentName}
        </div>

        <div className="w-full flex items-center mb-3">
          <SearchInput
            searchValue={searchValue}
            toggleSearchValue={setSearchValue}
            placeholder="Type name or address..."
          />
          <Button
            to={{ addAccOpened: true }}
            merge
            onClick={() => onOpenChange?.(false)}
            theme="secondary"
            className="ml-3 !py-2 !px-4 !min-w-max"
          >
            <AddWalletIcon className="h-6 w-auto mr-2" />
            Add wallet
          </Button>
        </div>

        {filteredAccounts.length > 0 ? (
          <ScrollAreaContainer
            ref={scrollAreaRef}
            className="w-full h-full box-content -mr-5 pr-5 grow "
            viewPortClassName="viewportBlock max-h-[16.25rem] pt-3 pb-5"
            viewPortStyle={{
              height: `${allAccounts.length * 4.5 + (allAccounts.length - 1) * 0.5 + 2}rem`,
            }}
            scrollBarClassName="pt-3 pb-5"
          >
            {filteredAccounts.map((account, index) => (
              <ProfileItem
                key={account.address}
                account={account}
                isActive={currentAccount.address === account.address}
                className={index === filteredAccounts.length - 1 ? "" : "mb-2"}
              />
            ))}
          </ScrollAreaContainer>
        ) : (
          <div
            className={classNames(
              "flex justify-center items-center",
              "w-full max-h-[14.25rem]",
              "border border-brand-light/[.05]",
              "rounded-[.625rem]",
              "text-sm text-brand-placeholder",
              "mb-[1.25rem] mt-[.75rem]",
            )}
            style={{
              height: `${allAccounts.length * 4.5 + (allAccounts.length - 1) * 0.5}rem`,
            }}
          >
            <NoResultsFoundIcon className="mr-5" />
            No results found
          </div>
        )}
      </div>
      <div
        className={classNames(
          "w-full",
          "border-t border-brand-light/[.05]",
          "pt-3 px-5 pb-5",
          "flex items-center gap-3",
        )}
      >
        <LockButton />
        <Button
          to={{ page: Page.Settings }}
          onClick={() => onOpenChange?.(false)}
          theme="secondary"
          className="w-full"
        >
          <GearIcon className="h-6 w-auto mr-2" />
          Settings
        </Button>
      </div>
    </SecondaryModal>
  );
};

type ProfileItemProps = {
  account: Account;
  isActive?: boolean;
  className?: string;
};

const ProfileItem: FC<ProfileItemProps> = ({
  account,
  isActive = false,
  className,
}) => (
  <button
    type="button"
    key={account.address}
    className={classNames(
      "w-full",
      "flex items-center",
      "min-w-0 min-h-[4.5rem] px-3 py-2",
      "border",
      "rounded-lg",
      isActive
        ? "border-brand-redone bg-brand-main/10"
        : "border-transparent hover:bg-brand-main/5 focus-visible:bg-brand-main/5",
      className,
    )}
  >
    <AutoIcon
      seed={account.address}
      source="dicebear"
      type="personas"
      className={classNames(
        "h-8 w-8 min-w-[2rem]",
        "mr-3",
        "bg-black/20",
        "rounded-[.625rem]",
      )}
    />

    <span className="flex flex-col text-left min-w-0 max-w-[40%] mr-auto">
      <WalletName wallet={account} theme="small" className="text-base" />
      <HashPreview
        hash={account.address}
        className={classNames(
          "text-sm font-normal mt-[2px]",
          isActive ? "text-brand-light" : "text-brand-inactivedark",
        )}
        withTooltip={false}
      />
    </span>
    <Balance
      address={account.address}
      className="text-base font-bold text-brand-light ml-auto"
    />
  </button>
);

const LockButton: FC = () => {
  const approvals = useAtomValue(approvalsAtom);
  const { confirm } = useDialog();

  const isPopup = isPopupPrimitive();

  const handleLock = useCallback(async () => {
    try {
      const approvalsAmount = approvals.length;
      const response =
        approvalsAmount === 0
          ? true
          : await confirm({
              title: "Lock",
              content: (
                <p
                  className={classNames(
                    !isPopup && "mb-4",
                    isPopup && "mb-2",
                    "mx-auto text-center",
                  )}
                >
                  Are you sure you want to lock the wallet? You have{" "}
                  {approvalsAmount} request{approvalsAmount > 1 ? "s" : ""}{" "}
                  waiting for approvals. If you lock the wallet now, all
                  requests will be cleared!
                </p>
              ),
              yesButtonText: "Lock",
            });

      if (response) {
        await lockWallet();
      }
    } catch (err) {
      console.error(err);
    }
  }, [approvals.length, confirm, isPopup]);

  return (
    <Button onClick={handleLock} theme="secondary" className="w-full">
      <LockIcon className="h-6 w-auto mr-2" />
      Lock
    </Button>
  );
};
