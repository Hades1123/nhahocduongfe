import { Dialog, Transition } from "@headlessui/react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dispatch, Fragment, SetStateAction } from "react";
import { twMerge } from "tailwind-merge";

interface ModalProps {
  isOpen: boolean;
  width?: number;
  setIsOpen?: Dispatch<SetStateAction<boolean>>;
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}
const Modal = ({
  isOpen = false,
  width,
  setIsOpen,
  title = "",
  children,
  className,
  onClose,
}: ModalProps) => {
  function closeModal() {
    setIsOpen && setIsOpen(false);
    onClose && onClose();
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        unmount
        as="div"
        className="relative z-10"
        onClose={closeModal}
        open={isOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                style={{ marginTop: "6rem", width: width ? width : "auto" }}
                className={twMerge(
                  "relative transform rounded-lg bg-white dark:bg-slate-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[70vw] sm:p-6 theme-modal-body",
                  // "overflow-hidden",
                  className,
                )}
              >
                <div className="absolute left-0 right-0 top-0 flex  items-center  justify-between bg-indigo-600 dark:bg-slate-800 px-4 theme-modal-header">
                  <h1 className="font-bold text-white">{title}</h1>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={closeModal}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-16">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
export default Modal;
