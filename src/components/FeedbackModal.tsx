import { Dialog, Transition } from "@headlessui/react";
import { atom, useAtom } from "jotai";
import { log } from "next-axiom";
import { type FormEventHandler, Fragment, useState } from "react";

export const isFeedbackOpenAtom = atom(false);

export const FeedbackModal = () => {
  const [isOpen, setIsOpen] = useAtom(isFeedbackOpenAtom);
  const [message, setMessage] = useState("");

  const submitFeedback: FormEventHandler = (e) => {
    e.preventDefault();
    log.debug("Feedback", {
      message,
    });
    setIsOpen(false);
  };

  return (
    <Transition.Root
      show={isOpen}
      as={Fragment}
      // TODO: This is bugged in the current version of Headless UI
      afterLeave={() => setMessage("")}
    >
      <Dialog
        onClose={setIsOpen}
        className="fixed inset-0 overflow-y-auto p-4 pt-32 z-50"
      >
        <Transition.Child
          as={Fragment}
          enter="duration-300 ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="duration-200 ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="bg-gray-500/7 fixed inset-0 transition-opacity" />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="duration-300 ease-out"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="duration-200 ease-in"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div className="relative mx-auto max-w-xl divide-primary divide-y-2 overflow-hidden rounded-md bg-background shadow ring-1 ring-black/5 border-2 border-primary">
            <form
              onSubmit={submitFeedback}
              className="flex flex-col justify-center space-y-2 my-12 mx-16"
            >
              <h1 className="text-accent font-medium text-lg">
                Quick Feedback
              </h1>
              <textarea
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="bg-background-light rounded p-3 text-light-gray border-gray-600 focus:border-accent focus:ring-accent resize-none"
              />
              <div className="flex justify-between">
                <p className="text-light-gray/50">Thanks for the feedback!</p>
                <button
                  type="submit"
                  disabled={message.length === 0}
                  className="py-2 px-3 bg-background-dark disabled:opacity-50 enabled:hover:bg-background-light rounded-md text-accent enabled:hover:cursor-pointer"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};
