import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";

interface MintingFormProps {
  description: string;
  image: string;
  animationUrl: string;
  attributes: { traitType: string; value: string }[];
  yourJSON: object;
  resetForm: () => void;
}

export const MintingForm: React.FC<MintingFormProps> = ({ yourJSON, resetForm }) => {
  const { address: connectedAddress } = useAccount();
  const { writeContractAsync } = useScaffoldWriteContract("PunkPosts");

  const [loading, setLoading] = useState(false);

  const uploadToIPFS = async () => {
    const notificationId = notification.loading("Uploading to IPFS...");
    try {
      const uploadedItem = await addToIPFS(yourJSON);
      notification.remove(notificationId);
      notification.success("Metadata uploaded to IPFS");

      return uploadedItem.path;
    } catch (error) {
      notification.remove(notificationId);
      notification.error("Failed to upload to IPFS");
      throw error;
    }
  };

  const handlePaidMint = async () => {
    if (!connectedAddress) {
      notification.error("Please connect your wallet");
      return;
    }

    setLoading(true);

    try {
      const ipfsPath = await uploadToIPFS();

      const contractResponse = await writeContractAsync({
        functionName: "createPost",
        args: [ipfsPath],
      });

      if (contractResponse) {
        notification.success("Posted successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Error during posting:", error);
      notification.error("Posting failed, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center mt-6 gap-3">
      <div className="flex items-center">
        <button className="cool-button" disabled={loading} onClick={handlePaidMint}>
          Create Post
        </button>
      </div>
    </div>
  );
};
