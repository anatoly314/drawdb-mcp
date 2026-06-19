import { socials } from "../data/socials";

export default function NotFound() {
  return (
    <div className="p-3 space-y-2">
      <p>hey there!</p>

      <p>looking for something you couldn&apos;t find?</p>
      <p>
        check out the{" "}
        <a className="text-blue-600" href="/docs">
          docs
        </a>{" "}
        or{" "}
        <a className="text-blue-600" href={`${socials.github}/issues`}>
          open an issue
        </a>
      </p>
      <br />
      <p className="opacity-70">
        * to create a relationship hold the blue dot of a field and drag it
        towards the field you want to connect it to
      </p>
    </div>
  );
}
